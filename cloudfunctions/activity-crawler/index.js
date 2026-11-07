// 公众号活动自动抓取 - CloudBase 云函数入口（Event Function）
//
// 触发方式（demo 阶段，已移除每日定时器，改为「问 Agent 才触发」）：
//   1) Agent 触发：agent-chat 每次被提问时 fire-and-forget 调本函数（quick 快速模式），
//      本函数内部按「自然日」限流，一天最多真正抓一次，避免刷爆搜狗被反爬。
//   2) 手动测试：直接调函数，传 {force:true} 绕过限流，或 {limit:N} 控制抓取号数。
//
// 抓取链路：按公众号名单逐个搜（搜狗）-> 解跳转 -> 抓正文 -> 抽取活动 -> 写入云数据库
//
// 为什么"按公众号名搜"而不是"直接爬公众号主页"：
//   微信公众号历史文章接口 mp.weixin.qq.com/mp/profile_ext 无登录会返回
//   {"ret":-3,"errmsg":"no session"}，需要登录态 key/pass_ticket（几小时过期，
//   且要从微信客户端抓包），云函数定时跑不了。搜狗微信搜索是无登录唯一正路。
//
// 数据模型对齐 PRD「找搭子」官方活动池：
//   活动名 / 日期 / 时间 / 地点 / 校区 / 类型 / 报名方式 / 状态 / 来源

const { SogouCrawler } = require('./sogou');
const { extractActivity, activityStatus } = require('./extract');

// 核心公众号名单（活动信息最集中的已核验官方号）
const ACCOUNTS = require('./accounts.json');

const RECENT_DAYS = 90;    // 只保留最近 N 天发布的文章
const MAX_PER_ACCOUNT = 3; // 每个公众号最多抓取文章数（完整模式）
const SLEEP_MS = 8000;     // 完整模式下每个公众号之间间隔（43 号 ≈ 774s，控制在 900s 超时内）
const QUICK_ACCOUNTS = 8;  // 快速模式只抓前 N 个核心官方号（供 Agent 触发秒回）

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 自然日字符串 YYYY-MM-DD（北京时间）
function todayStr() {
  const d = new Date(Date.now() + 8 * 3600000); // UTC+8
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

// 判断搜狗返回的文章所属公众号是否匹配目标公众号（双向包含）
function accountMatch(target, got) {
  if (!target || !got) return true;
  const norm = (s) => s.replace(/\s/g, '').replace(/（/g, '(').replace(/）/g, ')');
  const t = norm(target);
  const g = norm(got);
  return t === g || t.includes(g) || g.includes(t);
}

// 判断标题是否像活动内容（含活动词），用于放宽匹配、保留转载/相关活动
const ACTIVITY_TITLE_HINTS = ['活动', '讲座', '招新', '报名', '招募', '演出', '音乐会', '比赛', '竞赛', '沙龙', '论坛', '报告', '志愿', '实践', '训练营', '工作坊', '专场', '路演', '直播', '开放日'];

function looksLikeActivity(title) {
  if (!title) return false;
  return ACTIVITY_TITLE_HINTS.some((w) => title.includes(w));
}

async function crawl(accounts, crawler, opts = {}) {
  const quick = !!opts.quick;
  const maxPer = quick ? 1 : MAX_PER_ACCOUNT; // 快速模式每号 1 篇
  const between = quick ? 0 : SLEEP_MS;        // 快速模式号之间不 sleep
  const cutoff = Date.now() - RECENT_DAYS * 86400000;
  const activities = [];
  const seen = new Set();

  for (let i = 0; i < accounts.length; i++) {
    const name = accounts[i].name;
    console.log(`[${i + 1}/${accounts.length}] 「${name}」${quick ? ' (quick)' : ''}`);

    // 每个号一个搜索词（纯号名）。搜狗按号名搜本身就会返回该号近期发文，
    // 2 词搜索会触发反爬，1 词在容忍阈值内
    const queries = [name];
    const collected = [];
    const seenTitle = new Set();

    for (const q of queries) {
      let results;
      try {
        results = await crawler.search(q, 1);
      } catch (e) {
        console.log(`  搜索异常(${q}): ${e.message}`);
        continue;
      }

      // 触发验证码：直接停止本次运行，已抓到的数据正常写库（不冷却重试，省时间且数据不丢）
      if (crawler.blocked) {
        console.log('  触发搜狗验证码，停止本次运行（已抓数据会保留）');
        return activities;
      }

      for (const item of results) {
        if (collected.length >= maxPer) break;
        if ((item.publish_ts || 0) * 1000 < cutoff) continue;
        // 匹配策略：同号 OR 明显是复旦活动内容（标题含活动词）
        if (!accountMatch(name, item.account || '') && !looksLikeActivity(item.title)) continue;
        if (seenTitle.has(item.title)) continue;
        seenTitle.add(item.title);
        collected.push(item);
      }
      if (collected.length >= maxPer) break;
      if (between) await sleep(between);
    }

    let count = 0;
    for (const item of collected) {
      if (count >= maxPer) break;
      if (seen.has(item.title)) continue;
      seen.add(item.title);
      count++;

      const act = {
        source_type: 'official',
        source_account: name,
        title: item.title,
        activity_name: item.title, // 活动名暂用标题，后续 LLM 精抽
        account: item.account,
        summary: item.summary,
        publish_time: item.publish_time,
        publish_ts: item.publish_ts,
      };

      // 完整模式：解跳转 + 抓正文 + 抽取结构化字段
      // 快速模式：只保留标题/摘要/跳转链接，不抓正文（省时间，Agent 触发秒回）
      if (!quick && item.link) {
        try {
          const real = await crawler.resolve(item.link);
          if (real) {
            const art = await crawler.fetchArticle(real);
            act.real_url = real;
            act.content = (art.content || '').slice(0, 4000);
            act.extracted = extractActivity(act.title, art.content || '');
            act.activity_status = activityStatus(act.extracted);
          }
        } catch (e) {
          act.error = String(e);
        }
      } else if (item.link) {
        act.link = item.link; // 快速模式保留搜狗跳转链接
      }
      activities.push(act);
      if (between) await sleep(3000); // 同号内文章之间也限速
    }
    if (between) await sleep(between);
  }
  return activities;
}

async function writeToDb(db, activities) {
  if (!activities.length) return 0;
  const col = db.collection('activities');

  let existing = new Set();
  try {
    const res = await col.field({ real_url: true }).limit(1000).get();
    for (const d of res.data || []) if (d.real_url) existing.add(d.real_url);
  } catch (e) {
    console.log('查重失败(忽略):', e.message);
  }

  let inserted = 0;
  for (const act of activities) {
    if (act.real_url && existing.has(act.real_url)) continue;
    try {
      await col.add({ ...act, crawled_at: new Date().toISOString() });
      inserted++;
    } catch (e) {
      console.log('写入失败:', act.title, e.message);
    }
  }
  return inserted;
}

// 自然日限流：今天是否已经抓取过
async function alreadyCrawledToday(db) {
  const date = todayStr();
  try {
    const res = await db.collection('crawl_meta').where({ date }).limit(1).get();
    return !!(res.data && res.data.length);
  } catch (e) {
    console.log('限流检查失败(按未抓取处理):', e.message);
    return false;
  }
}

// 标记今天已抓取
async function markCrawled(db, fetched) {
  try {
    await db.collection('crawl_meta').add({ date: todayStr(), fetched, crawled_at: new Date().toISOString() });
  } catch (e) {
    console.log('写入 crawl_meta 失败:', e.message);
  }
}

exports.main = async (event, context) => {
  const cloud = require('@cloudbase/node-sdk');
  const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
  const db = app.database();

  const quick = !!(event && event.quick);
  const force = !!(event && event.force);

  // 自然日限流：一天最多真正抓一次（force 绕过，用于手动补抓/测试）
  if (!force && await alreadyCrawledToday(db)) {
    console.log('今天已抓取过，跳过（限流）');
    return { ok: true, skipped: true, reason: 'already_crawled_today', date: todayStr() };
  }

  const limit = (event && event.limit) ? Number(event.limit) : (quick ? QUICK_ACCOUNTS : ACCOUNTS.length);
  const accounts = ACCOUNTS.slice(0, limit);
  console.log('公众号名单:', accounts.length, '个（全量', ACCOUNTS.length, '，quick=', quick, '）');

  const crawler = new SogouCrawler();
  const activities = await crawl(accounts, crawler, { quick });

  let inserted = 0;
  try {
    inserted = await writeToDb(db, activities);
  } catch (e) {
    console.log('数据库写入失败:', e.message);
  }

  // 只有真正抓到东西才标记今天已抓（抓空说明可能被反爬，不锁死下次）
  if (activities.length > 0) {
    await markCrawled(db, activities.length).catch(() => {});
  }

  return {
    ok: true,
    quick,
    accounts: accounts.length,
    fetched: activities.length,
    inserted,
    blocked: crawler.blocked,
    date: todayStr(),
  };
};
