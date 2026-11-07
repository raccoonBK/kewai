'use strict';
// 无密码预探测：验证 UIS 链路前半段（重定向链 → 公钥 → 认证方式）
const { UisSession, parseLckEntityId } = require('./uis');

const ID_HOST = 'id.fudan.edu.cn';
const TIMETABLE_URL = 'https://fdjwgl.fudan.edu.cn/student/for-std/course-table';

(async () => {
  const s = new UisSession();

  console.log('第1步: 跟随重定向链到 UIS 登录页');
  let currentUrl = TIMETABLE_URL;
  let lck = null, entityId = null;
  for (let i = 0; i < 8; i++) {
    const res = await s.request('GET', currentUrl);
    console.log(`  [${i}] ${currentUrl.replace('https://', '').slice(0, 64)} → status:${res.status}`);
    if (!res.location) break;
    currentUrl = new URL(res.location, currentUrl).toString();
    try {
      ({ lck, entityId } = parseLckEntityId(currentUrl));
      console.log('  到达登录页，解析出 lck/entityId');
      break;
    } catch (e) { /* 继续跟随 */ }
  }
  console.log('  lck:', (lck || '(无)').slice(0, 48));
  console.log('  entityId:', (entityId || '(无)').slice(0, 48));

  console.log('\n第2步: 拿 RSA 公钥');
  const keyRes = await s.request('POST', `https://${ID_HOST}/idp/authn/getJsPublicKey`);
  const keyJson = JSON.parse(keyRes.body);
  console.log('  公钥数据前 60 字:', (keyJson.data || '(空)').slice(0, 60));

  console.log('\n第3步: queryAuthMethods 拿认证方式');
  const methodsRes = await s.request('POST', `https://${ID_HOST}/idp/authn/queryAuthMethods`, { json: { lck, entityId } });
  const methodsJson = JSON.parse(methodsRes.body);
  console.log('  second(需2FA):', methodsJson.second);
  console.log('  可用认证方式:', (methodsJson.data || []).map((m) => m.moduleCode).join(', '));
  const pwd = (methodsJson.data || []).find((m) => m.moduleCode === 'userAndPwd');
  console.log('  userAndPwd authChainCode:', pwd ? pwd.authChainCode.slice(0, 30) : '(未找到)');

  console.log('\n结论: 前 3 步（重定向链/公钥/认证方式）全部可用，链路前半段通。');
})().catch((e) => {
  console.error('探测失败:', e.name, '|', e.message);
  process.exit(1);
});
