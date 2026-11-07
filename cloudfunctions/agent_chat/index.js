'use strict';

/**
 * 课余 Agent 对话 · CloudBase HTTP 云函数（MiniMax 中转）
 *
 * 入口：http.createServer 监听 9000 端口（CloudBase HTTP 函数范式，scf_bootstrap 启动）。
 * 协议：POST / 任意路径，body = { messages: [{role,content}], context: {...} }
 * 返回：{ ok, reply, activityIds, resourceIds, thriftIds, buddyIds }
 *
 * 环境变量：MINIMAX_API_KEY（必填）
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 9000;
const MODEL = 'MiniMax-M3.1-Flash';

// ---- 藏触发点：每次提问 fire-and-forget 触发一次公众号抓取 ----
// 抓取函数 activity-crawler 内部按「自然日」限流，一天最多真正抓一次，
// 这里只管"敲门"，重复触发无害。SDK 不可用时静默降级，不影响对话主链路。
let _cloudApp = null;
function getCloudApp() {
  if (_cloudApp) return _cloudApp;
  try {
    const cloud = require('@cloudbase/node-sdk');
    _cloudApp = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
  } catch (e) {
    console.log('[crawl-nudge] cloudbase sdk 不可用:', e.message);
  }
  return _cloudApp;
}

function nudgeCrawl() {
  const app = getCloudApp();
  if (!app) return Promise.resolve();
  // await 触发（带 2.5s 超时兜底）：确保真正执行完再返回。
  // 限流命中时 activity-crawler 66ms 秒回，首次真抓约 2s，体验无感。
  const timeout = new Promise((r) => setTimeout(() => r({ timeout: true }), 2500));
  return Promise.race([
    app.callFunction({ name: 'activity-crawler', data: { quick: true } }).catch((e) => ({ error: e.message })),
    timeout,
  ]);
}

// ---- CORS ----
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders(),
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// ---- MiniMax 调用 ----
function minimaxChat(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      reasoning_effort: 'low',
      messages,
      max_tokens: 2000,
    });

    const req = https.request(
      {
        host: 'api.minimax.cn',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
          catch (e) { reject(new Error('响应解析失败: ' + data.slice(0, 300))); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(50000, () => req.destroy(new Error('MiniMax 请求超时（>50s）')));
    req.write(body);
    req.end();
  });
}

// ---- System Prompt ----
function buildSystemPrompt(ctx) {
  const act = (ctx.activities || []).map(a =>
    `- ${a.id} | ${a.title} | 类型:${a.type} | 主办:${a.host} | ${a.time} | ${a.place} | ${a.status}`
  ).join('\n');
  const res = (ctx.resources || []).map(r =>
    `- ${r.id} | ${r.subject} | ${r.teacher} | ${r.type} | ${r.title}`
  ).join('\n');
  const thrift = (ctx.thrift || []).map(t =>
    `- ${t.id} | ${t.cat} | ${t.title} | ¥${t.price} | ${t.place}`
  ).join('\n');
  const buddies = (ctx.buddies || []).map(b =>
    `- ${b.id} | ${b.scene} | ${b.title} | ${b.need} | ${b.time} | ${b.place}`
  ).join('\n');

  const p = ctx.profile || {};
  const profile = [p.identity, p.grade, p.campus].filter(Boolean).join(' · ') || '未知';

  return `你是「课余」，复旦大学的校园行动 Agent，帮学生把通知与需求转化为确定行动：推荐活动、找学习资料、淘二手好物、找搭子、办证明，核心目标是丰富课余生活。

你的风格：口语化、直接、有行动感、简洁（回复尽量在 120 字以内），简体中文，不客套、不废话、不说「作为 AI」这类话。

当前用户：${profile}

你掌握以下实时数据（每条都有唯一 id）：

【活动 activities】
${act || '（无）'}

【学习资料 resources】
${res || '（无）'}

【二手好物 thrift】
${thrift || '（无）'}

【搭子 buddies】
${buddies || '（无）'}

你的输出必须是严格 JSON（不要 markdown 代码块，不要输出 JSON 以外任何内容）：
{"reply":"给用户的回复文本","activityIds":[],"resourceIds":[],"thriftIds":[],"buddyIds":[]}

规则：
1. reply 是给用户看的自然语言回复，可直接展示。
2. 当用户需求能匹配到上面数据里的条目时，把对应条目的 id 填进对应数组；不匹配就填空数组。
3. 只填数据里真实存在的 id，绝不编造 id。
4. 用户问的是数据里没有的，诚实说明没有，并尽量给相近推荐。`;
}

// ---- 业务处理 ----
async function handleChat(payload) {
  await nudgeCrawl(); // 藏触发点：问 Agent 触发一次抓取（内部按自然日限流）

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return { ok: false, error: '服务端未配置 MINIMAX_API_KEY' };

  const { messages = [], context = {} } = payload || {};

  const sys = { role: 'system', content: buildSystemPrompt(context) };
  const { status, json } = await minimaxChat(apiKey, [sys, ...messages]);

  if (status !== 200) {
    return { ok: false, status, error: 'MiniMax 返回 ' + status + ': ' + JSON.stringify(json).slice(0, 300) };
  }

  const choice = json.choices && json.choices[0];
  if (!choice || !choice.message) {
    return { ok: false, error: 'MiniMax 返回体异常', raw: json };
  }

  const content = (choice.message.content || '').trim();
  const reasoning = choice.message.reasoning_content || '';

  let parsed;
  try { parsed = JSON.parse(content); }
  catch (e) { parsed = { reply: content, activityIds: [], resourceIds: [], thriftIds: [], buddyIds: [] }; }

  return {
    ok: true,
    reply: parsed.reply || '',
    activityIds: Array.isArray(parsed.activityIds) ? parsed.activityIds : [],
    resourceIds: Array.isArray(parsed.resourceIds) ? parsed.resourceIds : [],
    thriftIds: Array.isArray(parsed.thriftIds) ? parsed.thriftIds : [],
    buddyIds: Array.isArray(parsed.buddyIds) ? parsed.buddyIds : [],
    reasoning,
  };
}

// ---- HTTP 服务 ----
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: '仅支持 POST' });
    return;
  }

  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', async () => {
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; }
    catch (e) { return sendJson(res, 400, { ok: false, error: '请求体不是合法 JSON' }); }

    try {
      const result = await handleChat(payload);
      sendJson(res, result.ok ? 200 : 502, result);
    } catch (e) {
      sendJson(res, 500, { ok: false, error: e.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[agent-chat] listening on :${PORT}`);
});
