'use strict';

/**
 * 复旦 UIS 统一身份认证 + 课表拉取
 * 照 danxi-dev/danxi 的 neo_login_tool.dart 实现，纯 Node 内置模块，零外部依赖。
 *
 * 登录链路：
 *   1. GET  fdjwgl.fudan.edu.cn 课表页 → 302 重定向到 id.fudan.edu.cn，fragment 里带 lck / entityId
 *   2. POST id.fudan.edu.cn/idp/authn/getJsPublicKey            → 拿 RSA 公钥
 *   3. POST id.fudan.edu.cn/idp/authn/queryAuthMethods          → 拿 userAndPwd 的 authChainCode
 *   4. POST id.fudan.edu.cn/idp/authn/authExecute               → 拿 loginToken
 *   5. POST id.fudan.edu.cn/idp/authCenter/authnEngine          → 拿 ticket（HTML 里的 form#logon + input#ticket）
 *   6. GET  action + ticket                                     → 重定向回 fdjwgl，建立 session cookie
 *   7. GET  fdjwgl print-data                                   → 课表 JSON
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const ID_HOST = 'id.fudan.edu.cn';
const TIMETABLE_URL = 'https://fdjwgl.fudan.edu.cn/student/for-std/course-table';
const TIMETABLE_DATA_URL = 'https://fdjwgl.fudan.edu.cn/student/for-std/course-table/semester/{sem_id}/print-data';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

class UisError extends Error {
  constructor(type, message) {
    super(message);
    this.name = 'UisError';
    this.type = type; // captcha | credentials | 2fa | network | parse
  }
}

class UisSession {
  constructor() {
    this.cookieJar = {};
  }

  _saveCookies(headers) {
    const setCookies = headers['set-cookie'] || [];
    for (const sc of setCookies) {
      const eq = sc.indexOf('=');
      if (eq > 0) {
        const key = sc.slice(0, eq).trim();
        const val = sc.slice(eq + 1, sc.indexOf(';') > 0 ? sc.indexOf(';') : sc.length).trim();
        this.cookieJar[key] = val;
      }
    }
  }

  get cookie() {
    return Object.entries(this.cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  request(method, url, { json, form, followRedirects = false } = {}) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const mod = u.protocol === 'https:' ? https : http;
      let payload = null;
      let contentType = '';

      if (json) { payload = JSON.stringify(json); contentType = 'application/json'; }
      else if (form) { payload = new URLSearchParams(form).toString(); contentType = 'application/x-www-form-urlencoded'; }

      const headers = {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      };
      if (this.cookie) headers['Cookie'] = this.cookie;
      if (payload !== null) {
        headers['Content-Type'] = contentType;
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = mod.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers,
        // 复旦 *.fudan.edu.cn 证书由 sslTrus 签发，不在 Node 内置 CA 库，demo 阶段跳过校验
        rejectUnauthorized: false,
      }, (res) => {
        this._saveCookies(res.headers);
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode,
            headers: res.headers,
            location: res.headers.location || null,
            body,
          });
        });
      });
      req.on('error', (e) => reject(new UisError('network', e.message)));
      req.setTimeout(20000, () => req.destroy(new Error('timeout')));
      if (payload !== null) req.write(payload);
      req.end();
    });
  }
}

/** 从 id.fudan.edu.cn 的重定向 URL 里解析 lck 和 entityId（藏在 hash 路由的 query 里，形如 #/index?lck=...&entityId=...） */
function parseLckEntityId(redirectUrl) {
  const u = new URL(redirectUrl);
  const hash = u.hash.replace(/^#/, ''); // 去掉 # → "/index?lck=xxx&entityId=yyy&theme=zzz"
  const qIdx = hash.indexOf('?');
  const hashQuery = qIdx >= 0 ? hash.slice(qIdx + 1) : '';
  let lck = null, entityId = null;
  if (hashQuery) {
    const p = new URLSearchParams(hashQuery);
    lck = p.get('lck');
    entityId = p.get('entityId');
  }
  // hash 里没有就退回 query 里找
  if (!lck || !entityId) {
    lck = lck || u.searchParams.get('lck');
    entityId = entityId || u.searchParams.get('entityId');
  }
  if (!lck || !entityId) {
    throw new UisError('parse', '无法从重定向 URL 解析 lck/entityId: ' + redirectUrl);
  }
  return { lck, entityId };
}

/** 解析 postToken 返回的 HTML，拿 form#logon 的 action + input#ticket 的 value */
function parseTicket(html) {
  const action = /id="logon"[^>]*action="([^"]*)"/.exec(html)
    || /<form[^>]*action="([^"]*)"[^>]*id="logon"/.exec(html);
  const ticket = /id="ticket"[^>]*value="([^"]*)"/.exec(html)
    || /<input[^>]*value="([^"]*)"[^>]*id="ticket"/.exec(html);
  if (!action || !ticket) {
    throw new UisError('parse', '无法从 authnEngine 返回解析 ticket');
  }
  return { action: action[1], ticket: ticket[1] };
}

/** 用 RSA 公钥（PKCS8 PEM）加密密码，PKCS1 padding，返回 base64 */
function encryptPassword(pemKey, password) {
  const encrypted = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(password, 'utf8')
  );
  return encrypted.toString('base64');
}

/**
 * 登录并拉取课表。
 * @param {string} studentId 学号
 * @param {string} password UIS 密码
 * @returns {Promise<{courses: Array, raw: object}>}
 */
async function loginAndFetchTimetable(studentId, password) {
  const s = new UisSession();

  // 1. 访问课表页，跟随重定向链（fdjwgl → /student/sso/login → /authserver/login → /ac/#/index）直到解析出 lck/entityId
  let currentUrl = TIMETABLE_URL;
  let lck = null, entityId = null;
  for (let i = 0; i < 8; i++) {
    const res = await s.request('GET', currentUrl);
    if (!res.location) break; // 没有更多重定向
    currentUrl = new URL(res.location, currentUrl).toString();
    try {
      ({ lck, entityId } = parseLckEntityId(currentUrl));
      break; // 解析成功
    } catch (e) {
      // 还没到带 lck/entityId 的登录页，继续跟随
    }
  }
  if (!lck || !entityId) {
    throw new UisError('parse', '未到达 UIS 登录页（可能已登录或重定向链异常），停在: ' + currentUrl);
  }

  // 2. 拿 RSA 公钥
  const keyRes = await s.request('POST', `https://${ID_HOST}/idp/authn/getJsPublicKey`);
  const keyJson = JSON.parse(keyRes.body);
  const encodedKey = keyJson.data;
  if (!encodedKey) throw new UisError('parse', 'getJsPublicKey 未返回公钥');
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${encodedKey}\n-----END PUBLIC KEY-----`;

  // 3. 拿 authChainCode
  const methodsRes = await s.request('POST', `https://${ID_HOST}/idp/authn/queryAuthMethods`, {
    json: { lck, entityId },
  });
  const methodsJson = JSON.parse(methodsRes.body);
  if (methodsJson.second === true) {
    throw new UisError('2fa', '该服务需要二次认证（2FA），暂不支持');
  }
  const methods = methodsJson.data || [];
  const pwdMethod = methods.find((m) => m.moduleCode === 'userAndPwd');
  if (!pwdMethod) {
    throw new UisError('parse', '未找到 userAndPwd 认证方式: ' + methods.map((m) => m.moduleCode).join(','));
  }
  const authChainCode = pwdMethod.authChainCode;

  // 4. 加密密码并登录
  const encryptedPassword = encryptPassword(pemKey, password);
  const loginRes = await s.request('POST', `https://${ID_HOST}/idp/authn/authExecute`, {
    json: {
      authModuleCode: 'userAndPwd',
      authChainCode,
      entityId,
      requestType: 'chain_type',
      lck,
      authPara: {
        loginName: studentId,
        password: encryptedPassword,
        verifyCode: '',
      },
    },
  });
  const loginJson = JSON.parse(loginRes.body);
  const message = loginJson.message || '';
  if (message.includes('请输入验证码')) {
    throw new UisError('captcha', '触发验证码，需要手动过一次（密码错太多或 IP 风控）');
  }
  const loginToken = loginJson.loginToken;
  if (!loginToken) {
    if (message.includes('用户名或密码错误')) {
      throw new UisError('credentials', '用户名或密码错误');
    }
    throw new UisError('parse', '登录失败: ' + message);
  }

  // 5. postToken 换 ticket
  const tokenRes = await s.request('POST', `https://${ID_HOST}/idp/authCenter/authnEngine`, {
    json: { loginToken },
  });
  const { action, ticket } = parseTicket(tokenRes.body);
  const targetUrl = new URL(action);
  targetUrl.searchParams.set('ticket', ticket);

  // 6. 带 ticket 回跳，建立 fdjwgl session
  await s.request('GET', targetUrl.toString());

  // 7. 拿学期列表（从 course-table 页），取当前学期
  const pageRes = await s.request('GET', TIMETABLE_URL);
  const semesterId = parseSemesterId(pageRes.body);

  // 8. 拉课表 JSON
  const dataUrl = TIMETABLE_DATA_URL.replace('{sem_id}', semesterId);
  const dataRes = await s.request('GET', dataUrl);
  let raw;
  try {
    raw = JSON.parse(dataRes.body);
  } catch (e) {
    throw new UisError('parse', '课表接口返回非 JSON（可能 session 未建立成功）');
  }

  return { courses: extractCourses(raw), raw };
}

/** 从 course-table 页 HTML 里解析当前学期 id */
function parseSemesterId(html) {
  // 常见形式：value="2026-2027-1" 或 data-semester 等；这里做宽松匹配
  const m = /(?:semesterId|sem_id|data-semester)[=:"'\s]+([0-9]{4}-[0-9]{4}-[0-9])/.exec(html)
    || /value="([0-9]{4}-[0-9]{4}-[0-9])"/.exec(html);
  if (m) return m[1];
  // 兜底：返回 HTML 前 200 字用于排查
  throw new UisError('parse', '无法解析学期 id，页面内容: ' + html.slice(0, 200));
}

/** 从 print-data 返回的 JSON 提取课程列表 */
function extractCourses(raw) {
  const vms = raw.studentTableVms || [];
  const activities = vms.length ? (vms[0].activities || []) : [];
  return activities.map((a) => {
    // danxi 的 time_table 模型：courseName / teachers / weekDay / startUnit / endUnit / location
    return {
      name: a.courseName || a.course || '',
      teachers: (a.teachers || []).map((t) => t.name || t).filter(Boolean),
      weekday: a.weekDay,
      startUnit: a.startUnit,
      endUnit: a.endUnit,
      location: a.location || a.classroom || '',
      weeks: a.weeks || [],
    };
  });
}

module.exports = {
  UisSession,
  UisError,
  loginAndFetchTimetable,
  extractCourses,
  parseSemesterId,
  parseLckEntityId,
};
