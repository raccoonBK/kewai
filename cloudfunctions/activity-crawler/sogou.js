// -*- coding: utf-8 -*-
// 搜狗微信搜索 + 公众号文章正文抓取（Node.js 版，用于 CloudBase 云函数）
// 零第三方依赖，仅用 Node 内置 https/http + 正则

const https = require('https');
const http = require('http');
const { URL } = require('url');

const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const UA_WECHAT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.40';

function fetchHtml(url, opts = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': opts.ua || UA_DESKTOP,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': opts.referer || 'https://weixin.sogou.com/',
        ...(opts.cookie ? { 'Cookie': opts.cookie } : {}),
      },
    }, (res) => {
      // 跟随重定向（微信 src=11 链接会 302 到 &nwr_flag=1#wechat_redirect）
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirects >= 5) {
          resolve({ status: res.statusCode, body: '', setCookie: res.headers['set-cookie'] || [] });
          return;
        }
        const next = new URL(res.headers.location, url).toString();
        const mergedCookie = [opts.cookie, extractCookies(res.headers['set-cookie'] || [])].filter(Boolean).join('; ');
        fetchHtml(next, { ...opts, cookie: mergedCookie }, redirects + 1).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
          setCookie: res.headers['set-cookie'] || [],
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

function extractCookies(setCookieArr) {
  const map = {};
  for (const sc of setCookieArr) {
    const pair = (sc.split(';')[0] || '').trim();
    const eq = pair.indexOf('=');
    if (eq > 0) map[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

function stripTags(s) {
  return (s || '').replace(/<[^>]+>/g, '');
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// 搜狗搜索结果页 -> 文章列表
function parseSearchResults(html) {
  const results = [];
  const re = /<li id="sogou_vr_11002601_box_\d+"([\s\S]*?)<\/li>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const block = m[1];
    const item = {};
    const titleM = /<h3>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (titleM) item.title = decodeEntities(stripTags(titleM[1])).trim();
    const linkM = /href="(\/link\?url=[^"]+)"/.exec(block);
    if (linkM) item.link = 'https://weixin.sogou.com' + linkM[1].replace(/ /g, '%20');
    const acctM = /<span class="all-time-y2">([^<]*)<\/span>/.exec(block);
    if (acctM) item.account = decodeEntities(acctM[1]).trim();
    const sumM = /<p class="txt-info"[^>]*>([\s\S]*?)<\/p>/.exec(block);
    if (sumM) item.summary = decodeEntities(stripTags(sumM[1])).trim();
    const tsM = /timeConvert\('(\d+)'\)/.exec(block);
    if (tsM) {
      item.publish_ts = parseInt(tsM[1], 10);
      const d = new Date(item.publish_ts * 1000);
      item.publish_time = d.toISOString().slice(0, 10);
    }
    if (item.title) results.push(item);
  }
  return results;
}

// 从搜狗 /link 跳转页 JS 中拼接真实 mp.weixin URL
function resolveRealUrl(html) {
  const parts = [];
  const re = /url \+= '([^']*)'/g;
  let m;
  while ((m = re.exec(html)) !== null) parts.push(m[1]);
  if (parts.length) return parts.join('').replace(/@/g, '');
  const direct = /https?:\/\/mp\.weixin\.qq\.com[^"']*/.exec(html);
  return direct ? direct[0] : null;
}

// 从文章页提取标题 + 正文 + 图片
function parseArticle(html) {
  const art = {};
  const titleM = /id="activity-name"[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  if (titleM) art.title = decodeEntities(stripTags(titleM[1])).trim();
  const acctM = /id="js_name"[^>]*>([\s\S]*?)<\/a>/.exec(html);
  if (acctM) art.account = decodeEntities(stripTags(acctM[1])).trim();
  const ptM = /id="publish_time"[^>]*>([\s\S]*?)<\/em>/.exec(html);
  if (ptM) art.publish_time = decodeEntities(stripTags(ptM[1])).trim();
  let c = /id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/.exec(html);
  if (!c) c = /id="js_content"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  if (c) {
    let raw = c[1].replace(/<br[^>]*>/g, '\n').replace(/<\/p>/g, '\n');
    art.content = decodeEntities(stripTags(raw)).trim();
  }
  art.images = [];
  const imgRe = /data-src="(https?:\/\/mmbiz\.qpic\.cn[^"]+)"/g;
  let im;
  while ((im = imgRe.exec(html)) !== null) art.images.push(im[1]);
  return art;
}

class SogouCrawler {
  constructor() {
    this.cookie = '';
    this.blocked = false;
  }

  async search(query, page = 1) {
    const url = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(query)}&page=${page}&ie=utf8&s_from=input`;
    const res = await fetchHtml(url, { cookie: this.cookie });
    // 合并新 cookie
    const newCookie = extractCookies(res.setCookie);
    if (newCookie) this.cookie = newCookie;
    // 反爬检测（搜狗验证码页特征：VerifyCode / antispider / 验证码 / seccode）
    if (res.body.includes('VerifyCode') || res.body.includes('antispider') || res.body.includes('验证码') || /seccode/i.test(res.body)) {
      this.blocked = true;
      return [];
    }
    this.blocked = false;
    return parseSearchResults(res.body);
  }

  async resolve(linkUrl) {
    const res = await fetchHtml(linkUrl, { cookie: this.cookie, referer: 'https://weixin.sogou.com/' });
    return resolveRealUrl(res.body);
  }

  async fetchArticle(url) {
    const res = await fetchHtml(url, { ua: UA_WECHAT, referer: 'https://weixin.sogou.com/' });
    return parseArticle(res.body);
  }
}

module.exports = { SogouCrawler, fetchHtml };
