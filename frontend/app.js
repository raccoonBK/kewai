// ============ 数据 ============
const TYPE_MAP = {
  '讲座': { color: '#5a8fc7', soft: '#e8eff8', emoji: '🎤' },
  '运动': { color: '#769b66', soft: '#e8efdf', emoji: '🏸' },
  '志愿': { color: '#d4a84a', soft: '#f6eed9', emoji: '🤝' },
  '演出': { color: '#9b7bb5', soft: '#efe8f4', emoji: '🎭' },
  '比赛': { color: '#3d7fd6', soft: '#e8f0fa', emoji: '💻' },
  '社交': { color: '#c8a878', soft: '#f3ead9', emoji: '☕' },
};

// 广场「为你推荐」
const ACTIVITIES = [
  { id: 'a-badminton', title: '羽毛球约球，江湾体育馆', type: '运动', host: '羽毛球社', time: '今天 18:00', place: '江湾体育馆', status: '差 2 人', start: 18.0, end: 19.5, url: 'https://mp.weixin.qq.com/', going: '2 人已加入 · 差 2 人', desc: '低压力双打局，球费 AA，自带球拍即可。水平不限，主打开心出汗，结束可约晚饭。' },
  { id: 'a-talk', title: '复旦西部大讲堂：AI 与人文', type: '讲座', host: '复旦通识教育', time: '今天 19:00', place: '光华楼 202', status: '可报名', start: 19.0, end: 20.5, url: 'https://mp.weixin.qq.com/', going: '86 人已报名', desc: 'AI 时代的人文思考：当算法开始写诗、作曲、做判断，人文精神如何回应。通识教育中心主办，免费入场。' },
  { id: 'a-volunteer', title: '周末社区支教志愿者招募', type: '志愿', host: '青年志愿者协会', time: '周六 09:00', place: '杨浦社区中心', status: '已满', start: 9.0, end: 10.5, url: 'https://mp.weixin.qq.com/', going: '已报满', desc: '为社区流动儿童提供周末课业辅导与陪伴，需提前参加一次线上培训。名额有限，可开启补位提醒。' },
  { id: 'a-study', title: '跨院系学习小组，期末一起冲', type: '社交', host: '学习互助会', time: '工作日 19:00', place: '文图三楼', status: '差 1 人', start: 19.0, end: 20.0, url: 'https://mp.weixin.qq.com/', going: '3 人已加入 · 差 1 人', desc: '每晚 19:00 文图三楼静音区互监督自习，不刷手机，有问题互问。目标：期末一起上岸。' },
];

// 广场「本周精选」
const WEEK_ACTIVITIES = [
  { id: 'a-drama', title: '话剧《雷雨》学生专场', type: '演出', host: '复旦剧社', time: '周五 19:30', place: '相辉堂', status: '可报名', start: 19.5, end: 21.0, url: 'https://mp.weixin.qq.com/', going: '120 人已报名', desc: '复旦剧社年度学生专场，经典剧目《雷雨》校园版，凭校园卡免费领票，先到先得。' },
  { id: 'a-singer', title: '第 15 届校园歌手大赛海选', type: '比赛', host: '学生会文艺部', time: '周日 14:00', place: '叶耀珍楼', status: '报名中', start: 14.0, end: 16.0, url: 'https://mp.weixin.qq.com/', going: '报名进行中', desc: '第 15 届校园歌手大赛海选，不限风格，可独唱/合唱，报名截止本周日。' },
  { id: 'a-star', title: '天文社观星夜', type: '社交', host: '天文协会', time: '周六 20:00', place: '江湾大草坪', status: '差 3 人', start: 20.0, end: 22.0, url: 'https://mp.weixin.qq.com/', going: '15 人已加入 · 差 3 人', desc: '天文协会观星夜，江湾大草坪，提供望远镜，带你认识秋季星空。天气不好顺延。' },
];

const ALL_ACTIVITIES = [...ACTIVITIES, ...WEEK_ACTIVITIES];

// 课表（mock，一周；day: 1=周一 … 7=周日）
const COURSES = [
  // 周一
  { name: '普通化学', room: 'HGX207', day: 1, start: 8.0, end: 9.67 },
  { name: '城市化发展', room: 'H6509', day: 1, start: 9.92, end: 11.58 },
  // 周二
  { name: '有机化学', room: 'H3401', day: 2, start: 9.92, end: 11.58 },
  { name: '强国之路', room: '正大体育馆', day: 2, start: 13.5, end: 15.17 },
  // 周三
  { name: '分子与细胞', room: 'H4105', day: 3, start: 9.92, end: 11.58 },
  { name: '马原原理', room: 'HGX307', day: 3, start: 15.42, end: 17.08 },
  { name: '中国近现代史', room: 'HGX507', day: 3, start: 19.42, end: 21.08 },
  // 周四
  { name: '化学实验', room: '化学楼', day: 4, start: 8.92, end: 12.5 },
  { name: '健康体适能', room: '北区体育馆', day: 4, start: 13.5, end: 15.17 },
  { name: '深度学习', room: 'H4201', day: 4, start: 15.42, end: 17.08 },
  // 周五
  { name: '有机化学', room: 'H3401', day: 5, start: 9.92, end: 11.58 },
  { name: '分子与细胞', room: 'H4105', day: 5, start: 13.5, end: 15.17 },
  // 周日（临床见习）
  { name: '走近临床', room: 'H3309', day: 7, start: 8.0, end: 9.67 },
];

// 初始日历活动（day: 1=周一 … 7=周日）
const DEFAULT_EVENTS = [
  { id: 'a-talk', title: '复旦西部大讲堂', type: '讲座', time: '19:00', day: 3, start: 19.0, end: 20.5 },
  { id: 'a-drama', title: '话剧《雷雨》', type: '演出', time: '19:30', day: 5, start: 19.5, end: 21.0 },
  { id: 'a-badminton', title: '羽毛球约球', type: '运动', time: '18:00', day: 6, start: 18.0, end: 19.5 },
  { id: 'a-star', title: '天文社观星夜', type: '社交', time: '20:00', day: 6, start: 20.0, end: 22.0 },
  { id: 'a-vol', title: '社区志愿服务', type: '志愿', time: '09:00', day: 6, start: 9.0, end: 10.5 },
];

// 资源市场（闲鱼多维筛选）
const RESOURCES = [
  { id: 'r1', subject: '高等数学', teacher: '李教授', type: '试卷', year: '2023', title: '高等数学(下)期末A卷含参考解析', desc: '李教授期末命题风格汇总，含重点曲面积分与微分方程真题。', tags: ['含答案', '必做'], downloads: '260', score: '4.9' },
  { id: 'r2', subject: '大学物理', teacher: '张老师', type: 'PPT', year: '2024', title: '大物电磁学与热学全套课程PPT', desc: '张老师精品课程课件，公式推导严谨，适合考前突击梳理。', tags: ['高清完整'], downloads: '185', score: '4.8' },
  { id: 'r3', subject: '计算机网络', teacher: '王教授', type: '例题', year: '2023', title: '计网核心计算题与协议考点例题库', desc: '王教授往年常考子网划分、拥塞控制算法专题剖析。', tags: ['必做20题'], downloads: '310', score: '5.0' },
  { id: 'r4', subject: '高等数学', teacher: '李教授', type: '作业', year: '2024', title: '高数平时经典课后作业答疑汇编', desc: '包含每一章作业题步骤与易错点标注，适合期末复习自查。', tags: ['完整步骤'], downloads: '140', score: '4.7' },
  { id: 'r5', subject: '线性代数', teacher: '刘老师', type: '笔记', year: '2022', title: '线性代数矩阵特征值速查考纲', desc: '刘老师考前串讲笔记，重点总结特征向量与二次型化简。', tags: ['思维导图'], downloads: '98', score: '4.6' },
  { id: 'r6', subject: '大学物理', teacher: '张老师', type: '试卷', year: '2022', title: '大物光学波动历年真题精编', desc: '含衍射、干涉重点题型与解析，考前自测首选。', tags: ['含答案'], downloads: '205', score: '4.8' },
];

// 二手闲置
const THRIFT = [
  { id: 't1', cat: '数码', emoji: '🖥️', cond: '95新', title: '戴尔 24寸 4K Type-C 显示器', price: '480', orig: '1299', place: '江湾校区' },
  { id: 't2', cat: '教材', emoji: '📖', cond: '99新', title: '同济大学《高等数学》第七版上下册', price: '28', orig: '86', place: '邯郸本部' },
  { id: 't3', cat: '生活', emoji: '🍲', cond: '9成新', title: '宿舍小电锅 1.5L 多功能煮面蒸蛋', price: '35', orig: '99', place: '枫林校区' },
  { id: 't4', cat: '运动', emoji: '🚲', cond: '8成新', title: '捷安特通勤自行车 可折叠', price: '260', orig: '680', place: '江湾校区' },
];

// 找搭子
const BUDDIES = [
  { id: 'b1', scene: '学习', title: '图书馆五楼静音区期末自习打卡组', desc: '每天早 8:00 - 晚 21:00 互相监督不刷手机，已就位 3 人。', need: '缺 2 人', time: '每天 8:00-21:00', place: '总图书馆五楼', host: '大三计算机系' },
  { id: 'b2', scene: '运动', title: '周六下午气膜馆羽毛球双打趣味局', desc: '已订好 15:00 - 17:00 3号场地，自带球拍，球费AA均摊。', need: '缺 1 人', time: '周六 15:00-17:00', place: '江湾体育馆气膜馆', host: '研一材料所' },
  { id: 'b3', scene: '出行', title: '周末周边徒步摄影拼车小分队', desc: '路线：佘山国家森林公园轻徒步，自带相机，轻松拍照。', need: '缺 3 人', time: '周日 9:00 集合', place: '校北门地铁口', host: '大二外文学院' },
  { id: 'b4', scene: '比赛', title: '数学建模国赛跨院系组队', desc: '寻找编程+写作队友，已有建模选手，冲国奖。', need: '缺 1 人', time: '下月开赛', place: '线上 + 图书馆', host: '大四数院' },
];

// ============ 我的日历（状态） ============
const LS_KEY = 'kewai_calendar';
let myCalendar = loadCalendar();

function loadCalendar() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(saved) && saved.length) {
      // 迁移：旧数据无 day 字段，按 time 补上
      return saved.map(e => e.day ? e : { ...e, day: dayFromTime(e.time) });
    }
  } catch (e) {}
  return [...DEFAULT_EVENTS];
}
function saveCalendar() { localStorage.setItem(LS_KEY, JSON.stringify(myCalendar)); }
function isAdded(id) { return myCalendar.some(a => a.id === id); }
function addToCalendar(act) {
  if (isAdded(act.id)) return false;
  myCalendar.push({ id: act.id, title: act.title, type: act.type, time: act.time, day: dayFromTime(act.time), start: act.start, end: act.end });
  saveCalendar();
  return true;
}
function removeFromCalendar(id) {
  myCalendar = myCalendar.filter(a => a.id !== id);
  saveCalendar();
}

// ============ Toast ============
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ============ 工具 ============
const $ = s => document.querySelector(s);

const SVG_TIME = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const SVG_PIN = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

function fmtTime(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh + ':' + (mm < 10 ? '0' + mm : mm);
}

// ============ 日历日期工具 ============
function todayDay() {
  const g = new Date().getDay(); // 0=周日 … 6=周六
  return g === 0 ? 7 : g;        // 转 1=周一 … 7=周日
}
function dayFromTime(t) {
  t = t || '';
  const m = t.match(/周([一二三四五六日天])/);
  if (m) return { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7 }[m[1]];
  return todayDay();
}

// ============ 开屏 ============
function initSplash() {
  $('#splash-enter').addEventListener('click', () => {
    $('#splash').hidden = true;
    if (getProfile()) enterApp();
    else startOnboarding();
  });
}

// ============ 入口引导（身份/年级/校区） ============
const PROFILE_KEY = 'kewai_profile';
function getProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch (e) { return null; } }
function saveProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

const OB_EMOJI = {
  '本科生': '🎓', '硕士生': '📚', '博士生': '🔬', '教职工': '🏫',
  '邯郸校区': '🏛️', '江湾校区': '🌿', '枫林校区': '🍁', '张江校区': '💻',
};
const GRADE_OPTIONS = {
  '本科生': ['大一', '大二', '大三', '大四', '大五'],
  '硕士生': ['研一', '研二', '研三'],
  '博士生': ['博一', '博二', '博三', '博四', '博五'],
};

let obStep = 0;
let obProfile = { identity: '', grade: '', campus: '' };

function obTotal() { return obProfile.identity === '教职工' ? 2 : 3; }
function obKey() { return obStep === 0 ? 'identity' : (obStep === 1 ? 'grade' : 'campus'); }

function startOnboarding() {
  obStep = 0;
  obProfile = { identity: '', grade: '', campus: '' };
  $('#onboarding').hidden = false;
  renderObStep();
}

function renderObStep() {
  const total = obTotal();
  $('#ob-progress').innerHTML = Array.from({ length: total }, (_, i) => `<span class="ob-dot ${i <= obStep ? 'active' : ''}"></span>`).join('');
  $('#ob-back').style.visibility = obStep === 0 ? 'hidden' : 'visible';
  $('#ob-next').disabled = true;
  $('#ob-next').textContent = (obStep === total - 1) ? '完成' : '下一步';

  const stage = $('#ob-stage');
  let title, sub, opts;
  if (obStep === 0) {
    title = '先认识一下你'; sub = '选择你的身份，我会据此推荐更适合你的活动与资源。';
    opts = ['本科生', '硕士生', '博士生', '教职工'];
  } else if (obStep === 1) {
    title = '你的年级是？'; sub = '按你的身份匹配年级，课表与活动推荐会更精准。';
    opts = GRADE_OPTIONS[obProfile.identity] || [];
  } else {
    title = '你常在哪个校区？'; sub = '我们会优先推送你所在校区的活动与搭子。';
    opts = ['邯郸校区', '江湾校区', '枫林校区', '张江校区'];
  }

  stage.innerHTML = `
    <div class="ob-title">${title}</div>
    <p class="ob-sub">${sub}</p>
    <div class="ob-options">
      ${opts.map(o => `<button class="ob-opt" data-v="${o}">${OB_EMOJI[o] ? `<span class="oo-emoji">${OB_EMOJI[o]}</span>` : ''}${o}</button>`).join('')}
    </div>`;

  const key = obKey();
  stage.querySelectorAll('.ob-opt').forEach(btn => {
    if (btn.dataset.v === obProfile[key]) btn.classList.add('active');
    btn.addEventListener('click', () => {
      stage.querySelectorAll('.ob-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      obProfile[key] = btn.dataset.v;
      $('#ob-next').disabled = false;
    });
  });
}

function initOnboarding() {
  $('#ob-next').addEventListener('click', () => {
    const total = obTotal();
    if (obStep < total - 1) {
      if (obStep === 0 && obProfile.identity === '教职工') obStep = 2;
      else obStep++;
      renderObStep();
    } else {
      saveProfile(obProfile);
      $('#onboarding').hidden = true;
      enterApp();
    }
  });
  $('#ob-skip').addEventListener('click', () => {
    saveProfile({ identity: '本科生', grade: '大二', campus: '邯郸校区', skipped: true });
    $('#onboarding').hidden = true;
    enterApp();
  });
  $('#ob-back').addEventListener('click', () => {
    if (obStep === 0) return;
    if (obStep === 2 && obProfile.identity === '教职工') obStep = 0;
    else obStep--;
    renderObStep();
  });
}

function enterApp() {
  $('#app').hidden = false;
  enterAgent();
}

// ============ Tab 切换 ============
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('#page-' + name).classList.add('active');
  if (name === 'calendar') renderCalendar();
  if (name === 'agent' && $('#agent-dynamic').children.length === 0) enterAgent();
  if (name === 'publish') initModPanel(); // 确保默认面板渲染
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

// ============ 广场 ============
function eventCardHTML(a) {
  const t = TYPE_MAP[a.type] || { color: '#5a8fc7', soft: '#e8eff8', emoji: '📌' };
  const added = isAdded(a.id);
  return `
    <div class="event-card" data-id="${a.id}">
      <div class="ec-cover" style="background:${t.soft}">
        <span>${t.emoji}</span>
        <span class="ec-status" style="background:${t.color}">${a.status}</span>
      </div>
      <div class="ec-body">
        <div class="ec-host"><span class="h-ava"></span><span class="h-name">${a.host}</span></div>
        <div class="ec-title">${a.title}</div>
        <div class="ec-meta">
          <span>${SVG_TIME}${a.time}</span>
          <span>${SVG_PIN}${a.place}</span>
        </div>
        <button class="ec-add ${added ? 'added' : ''}" data-id="${a.id}">
          ${added ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>已加日历' : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>加入日历'}
        </button>
      </div>
    </div>`;
}

function renderPlaza() {
  $('#plaza-feed').innerHTML = ACTIVITIES.map(eventCardHTML).join('');
  $('#plaza-feed-week').innerHTML = WEEK_ACTIVITIES.map(eventCardHTML).join('');
}

function initPlazaActions() {
  const handler = e => {
    const btn = e.target.closest('.ec-add');
    if (btn) {
      const act = ALL_ACTIVITIES.find(a => a.id === btn.dataset.id);
      if (!act) return;
      if (isAdded(act.id)) { removeFromCalendar(act.id); toast('已从日历移除'); }
      else { addToCalendar(act); toast('已加入你的日历 📅'); }
      renderPlaza();
      renderCalendar();
      return;
    }
    const card = e.target.closest('.event-card');
    if (card) openEventDetail(card.dataset.id);
  };
  $('#plaza-feed').addEventListener('click', handler);
  $('#plaza-feed-week').addEventListener('click', handler);
}

// ============ 活动详情（深层页面） ============
const AVATAR_COLORS = ['#9b7bb5', '#5a8fc7', '#769b66', '#d4a84a', '#e27d5f'];

function openEventDetail(id) {
  const a = ALL_ACTIVITIES.find(x => x.id === id);
  if (!a) return;
  const t = TYPE_MAP[a.type] || { color: '#5a8fc7', soft: '#e8eff8', emoji: '📌' };
  const added = isAdded(a.id);
  const full = a.status === '已满';
  const num = (a.going.match(/\d+/) || [])[0] || '';

  $('#ed-sheet').innerHTML = `
    <div class="ed-grab"></div>
    <div class="ed-head">
      <button class="ed-icon" id="ed-close" aria-label="关闭">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <button class="ed-share" id="ed-share" aria-label="分享">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4M12 2v13"/></svg>
      </button>
    </div>
    <div class="ed-cover" style="background:${t.soft}">
      <span class="ed-emoji">${t.emoji}</span>
      <span class="ed-status" style="background:${t.color}">${a.status}</span>
    </div>
    <div class="ed-content">
      <div class="ed-host">${a.host} · ${a.type}</div>
      <h2 class="ed-title">${a.title}</h2>
      <div class="ed-info">
        <div class="ei-row">${SVG_TIME}<span>${a.time}</span></div>
        <div class="ei-row">${SVG_PIN}<span>${a.place}</span></div>
        <div class="ei-row"><span class="ei-ic">👥</span><span>${a.going}</span></div>
      </div>
      <p class="ed-desc">${a.desc}</p>
      <div class="ed-actions">
        ${full
          ? '<button class="ed-btn primary" id="ed-watch">开启抢票提醒</button>'
          : '<button class="ed-btn primary" id="ed-signup">去报名</button>'}
        <button class="ed-btn" id="ed-add" data-id="${a.id}">${added ? '✓ 已加入日历' : '加入日历'}</button>
        <button class="ed-btn" id="ed-forward">转发给好友</button>
      </div>
      <div class="ed-attendees">
        <div class="ea-head"><span class="ea-label">参与的人</span><span class="ea-see">See all →</span></div>
        <div class="ea-avatars">
          ${['时', '李', '王', '张', '陈'].map((n, i) => `<span class="ea-ava" style="background:${AVATAR_COLORS[i]}">${n}</span>`).join('')}
          ${num ? `<span class="ea-more">+${num}</span>` : ''}
        </div>
      </div>
    </div>`;

  $('#event-detail').classList.add('open');

  $('#ed-close').onclick = closeEventDetail;
  $('#ed-share').onclick = () => toast('分享卡片已生成（demo）→ 复制链接');
  $('#ed-forward').onclick = () => toast('转发给好友（demo）→ 分享卡片已生成');
  const signup = $('#ed-signup');
  if (signup) signup.onclick = () => toast('已跳转到报名页（demo）→ 原链报名');
  const watch = $('#ed-watch');
  if (watch) watch.onclick = () => toast('已开启抢票提醒，放票第一时间通知你 ⏰');
  $('#ed-add').onclick = () => {
    if (isAdded(a.id)) { removeFromCalendar(a.id); toast('已从日历移除'); }
    else { addToCalendar(a); toast('已加入你的日历 📅'); }
    renderPlaza();
    renderCalendar();
    openEventDetail(a.id);
  };
}

function closeEventDetail() {
  $('#event-detail').classList.remove('open');
}

function initEventDetail() {
  $('#ed-mask').addEventListener('click', closeEventDetail);
}

// 金刚区跳转
function initNavTiles() {
  document.querySelectorAll('.nav-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      switchTab('publish');
      switchPanel(tile.dataset.goto);
    });
  });
}

// Agent 横幅唤起
function initAgentBanner() {
  $('#plaza-hero-banner').addEventListener('click', () => switchTab('agent'));
  $('#plaza-agent-quick').addEventListener('click', () => switchTab('agent'));
}

// ============ 日历 ============
const TIME_COL_W = 44;                            // 左侧时间轴宽度(px)
const DAY_START = 8, DAY_END = 22, HOUR_PX = 44;  // 时间范围与每小时高度
let weekOffset = 0;                               // 周偏移(0=本周)

function renderCalendar() {
  renderWeekBar();
  renderTable();
  const prev = $('#cal-prev'), next = $('#cal-next');
  if (prev) prev.onclick = () => { weekOffset--; renderWeekBar(); };
  if (next) next.onclick = () => { weekOffset++; renderWeekBar(); };
}

function weekMonday() {
  const today = new Date();
  const dow = today.getDay(); // 0=周日
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function renderWeekBar() {
  const monday = weekMonday();
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const f = d => (d.getMonth() + 1) + '/' + d.getDate();
  $('#cal-weeklabel').textContent = `${f(monday)} - ${f(sunday)}`;
}

function renderTable() {
  const table = $('#cal-table');
  table.innerHTML = '';

  // ---- 表头：左上角占位 + 7 天 ----
  const thead = document.createElement('div');
  thead.className = 'cal-thead';
  const corner = document.createElement('div');
  corner.className = 'cal-corner';
  thead.appendChild(corner);

  const monday = weekMonday();
  const todayIdx = todayDay();
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  for (let d = 1; d <= 7; d++) {
    const dt = new Date(monday); dt.setDate(monday.getDate() + d - 1);
    const cell = document.createElement('div');
    cell.className = 'cal-hday' + (d === todayIdx && weekOffset === 0 ? ' today' : '');
    cell.innerHTML = `<span class="hd-dow">${names[d - 1]}</span><span class="hd-date">${dt.getDate()}</span>`;
    thead.appendChild(cell);
  }
  table.appendChild(thead);

  // ---- 主体网格 ----
  const body = document.createElement('div');
  body.className = 'cal-body';
  body.style.height = (DAY_END - DAY_START) * HOUR_PX + 'px';

  for (let h = DAY_START; h <= DAY_END; h++) {
    const y = (h - DAY_START) * HOUR_PX;
    const lbl = document.createElement('div');
    lbl.className = 'cal-time';
    lbl.style.top = y + 'px';
    lbl.textContent = h + ':00';
    body.appendChild(lbl);
    const line = document.createElement('div');
    line.className = 'cal-gridh';
    line.style.top = y + 'px';
    body.appendChild(line);
  }

  for (let d = 0; d <= 7; d++) {
    const v = document.createElement('div');
    v.className = 'cal-gridv';
    v.style.left = `calc(${TIME_COL_W}px + ${d} * (100% - ${TIME_COL_W}px) / 7)`;
    body.appendChild(v);
  }

  COURSES.forEach(c => body.appendChild(courseCell(c)));
  myCalendar.forEach(e => body.appendChild(eventCell(e)));

  table.appendChild(body);
}

function courseCell(c) {
  const el = document.createElement('div');
  el.className = 'cal-cell course';
  el.style.top = (c.start - DAY_START) * HOUR_PX + 'px';
  el.style.height = Math.max((c.end - c.start) * HOUR_PX - 3, 20) + 'px';
  el.style.left = `calc(${TIME_COL_W}px + ${c.day - 1} * (100% - ${TIME_COL_W}px) / 7)`;
  el.style.width = `calc((100% - ${TIME_COL_W}px) / 7)`;
  el.innerHTML = `<div class="cc-name">${c.name}</div><div class="cc-sub">${c.room}</div>`;
  return el;
}

function eventCell(e) {
  const t = TYPE_MAP[e.type] || { color: '#9a9990', soft: '#f0efe9' };
  const day = e.day || todayDay();
  const el = document.createElement('div');
  el.className = 'cal-cell event';
  el.style.top = (e.start - DAY_START) * HOUR_PX + 'px';
  el.style.height = Math.max((e.end - e.start) * HOUR_PX - 3, 20) + 'px';
  el.style.left = `calc(${TIME_COL_W}px + ${day - 1} * (100% - ${TIME_COL_W}px) / 7)`;
  el.style.width = `calc((100% - ${TIME_COL_W}px) / 7)`;
  el.style.background = t.soft;
  el.style.borderLeftColor = t.color;
  el.innerHTML = `<div class="cc-name" style="color:${t.color}">${e.title}</div><div class="cc-sub">${fmtTime(e.start)}</div>`;
  return el;
}

// ============ Agent ============
function recCardHTML(a) {
  const t = TYPE_MAP[a.type] || { color: '#5a8fc7', soft: '#e8eff8', emoji: '📌' };
  const added = isAdded(a.id);
  const full = a.status === '已满' || a.status === '报名中';
  return `
    <div class="rec-card" data-id="${a.id}">
      <div class="rec-cover" style="background:${t.soft}">${t.emoji}</div>
      <div class="rec-body">
        <div class="rec-title">${a.title}</div>
        <div class="rec-meta">${a.time} · ${a.place}</div>
        <span class="rec-tag" style="background:${t.color}">${a.type} · ${a.status}</span>
        <div class="rec-actions">
          ${full
            ? '<button class="ra-btn ra-watch" data-act="watch" data-id="' + a.id + '">抢票提醒</button>'
            : '<button class="ra-btn ra-sign" data-act="signup" data-id="' + a.id + '">去报名</button>'}
          <button class="ra-btn" data-act="remind" data-id="${a.id}">设提醒</button>
          <button class="ra-btn ${added ? 'ra-added' : ''}" data-act="add" data-id="${a.id}">${added ? '已加日历' : '加日历'}</button>
        </div>
      </div>
    </div>`;
}

// 资源推荐卡（Agent 内）
function resRecHTML(r) {
  return `
    <div class="rec-card" data-id="${r.id}">
      <div class="rec-cover" style="background:#e8efdf">📚</div>
      <div class="rec-body">
        <div class="rec-title">${r.title}</div>
        <div class="rec-meta">${r.subject} · ${r.teacher} · ${r.year}年 · ${r.type}</div>
        <span class="rec-tag" style="background:#769b66">${r.downloads} 次下载 · 评分 ${r.score}</span>
        <div class="rec-actions">
          <button class="ra-btn ra-sign" data-act="dl" data-id="${r.id}">获取资料</button>
          <button class="ra-btn" data-act="goto-res" data-id="${r.id}">去资源市场</button>
        </div>
      </div>
    </div>`;
}

// 二手推荐卡（Agent 内）
function thriftRecHTML(t) {
  return `
    <div class="rec-card" data-id="${t.id}">
      <div class="rec-cover" style="background:#f6eed9">${t.emoji}</div>
      <div class="rec-body">
        <div class="rec-title">${t.title}</div>
        <div class="rec-meta">${t.cond} · ${t.place}</div>
        <span class="rec-tag" style="background:#d4a84a">¥ ${t.price} <s style="opacity:.7;font-weight:400;">¥${t.orig}</s></span>
        <div class="rec-actions">
          <button class="ra-btn ra-sign" data-act="contact" data-id="${t.id}">联系卖家</button>
          <button class="ra-btn" data-act="goto-thrift" data-id="${t.id}">去二手市场</button>
        </div>
      </div>
    </div>`;
}

// 搭子推荐卡（Agent 内）
function buddyRecHTML(b) {
  return `
    <div class="rec-card" data-id="${b.id}">
      <div class="rec-cover" style="background:#e8eff8">🤝</div>
      <div class="rec-body">
        <div class="rec-title">${b.title}</div>
        <div class="rec-meta">${b.time} · ${b.place}</div>
        <span class="rec-tag" style="background:#5a8fc7">${b.scene}场景 · ${b.need}</span>
        <div class="rec-actions">
          <button class="ra-btn ra-sign" data-act="join" data-id="${b.id}">申请加入</button>
          <button class="ra-btn" data-act="goto-buddy" data-id="${b.id}">去搭子广场</button>
        </div>
      </div>
    </div>`;
}

function enterAgent() {
  const dyn = $('#agent-dynamic');
  dyn.innerHTML = '';
  appendMsg({ role: 'agent', text: '时钟，下午好 👋 结合你的课表和偏好，我挑了几个活动，先给你看一眼。' });
  appendMsg({ role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-badminton'), ALL_ACTIVITIES.find(a => a.id === 'a-talk')] });
  appendMsg({ role: 'agent', text: '你 16:00 下课，去江湾体育馆 20 分钟，正好赶得上 18:00 的羽毛球局。想让我帮你<b>报名</b>、<b>设个提醒</b>，还是先加进日历？' });
}

function appendMsg(m) {
  const dyn = $('#agent-dynamic');
  const chat = $('#agent-chat');
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + m.role;

  if (m.sources) {
    const s = document.createElement('div');
    s.className = 'msg-sources';
    s.innerHTML = m.sources;
    wrap.appendChild(s);
  }

  if (m.cards) {
    const inner = document.createElement('div');
    inner.className = 'bubble';
    inner.innerHTML = `<div class="rec-cards">${m.cards.map(recCardHTML).join('')}</div>`;
    wrap.appendChild(inner);
  } else if (m.resCards) {
    const inner = document.createElement('div');
    inner.className = 'bubble';
    inner.innerHTML = `<div class="rec-cards">${m.resCards.map(resRecHTML).join('')}</div>`;
    wrap.appendChild(inner);
  } else if (m.thriftCards) {
    const inner = document.createElement('div');
    inner.className = 'bubble';
    inner.innerHTML = `<div class="rec-cards">${m.thriftCards.map(thriftRecHTML).join('')}</div>`;
    wrap.appendChild(inner);
  } else if (m.buddyCards) {
    const inner = document.createElement('div');
    inner.className = 'bubble';
    inner.innerHTML = `<div class="rec-cards">${m.buddyCards.map(buddyRecHTML).join('')}</div>`;
    wrap.appendChild(inner);
  } else if (m.text) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.innerHTML = m.text;
    wrap.appendChild(b);
  } else if (m.thinking) {
    wrap.innerHTML = `<div class="thinking"><span class="dot-pulse"></span>${m.thinking}</div>`;
  }

  dyn.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return wrap;
}

function initAgentActions() {
  $('#agent-dynamic').addEventListener('click', e => {
    const btn = e.target.closest('.ra-btn');
    if (btn) {
      const action = btn.dataset.act;
      const id = btn.dataset.id;

      if (action === 'signup') { openEventDetail(id); }
      else if (action === 'watch') toast('已开启抢票提醒，放票第一时间通知你 ⏰');
      else if (action === 'dl') toast('资料获取中（demo）→ 下载链接已就绪');
      else if (action === 'contact') toast('已为你发起会话（demo）→ 联系卖家');
      else if (action === 'join') toast('已提交入组申请（demo）→ 等待发起人确认');
      else if (action === 'goto-res') { switchTab('publish'); switchPanel('res'); }
      else if (action === 'goto-thrift') { switchTab('publish'); switchPanel('thrift'); }
      else if (action === 'goto-buddy') { switchTab('publish'); switchPanel('buddy'); }
      else if (action === 'remind') {
        const act = ALL_ACTIVITIES.find(a => a.id === id);
        toast(act ? `已设提醒：${act.time} 前 30 分钟提醒你 ⏰` : '已设提醒 ⏰');
      }
      else if (action === 'add') {
        const act = ALL_ACTIVITIES.find(a => a.id === id);
        if (!act) return;
        if (isAdded(act.id)) { removeFromCalendar(act.id); toast('已从日历移除'); }
        else { addToCalendar(act); toast('已加入你的日历 📅'); }
        renderPlaza();
        renderCalendar();
      }
      return;
    }
    // 非按钮 → 点推荐卡片进详情（仅活动卡片）
    const card = e.target.closest('.rec-card');
    if (card && ALL_ACTIVITIES.some(a => a.id === card.dataset.id)) {
      openEventDetail(card.dataset.id);
    }
  });
}

function replyFor(input) {
  const q = input.toLowerCase();
  const has = kw => q.includes(kw);

  // 证明办事
  if (has('证明') || has('在读') || has('开具')) {
    return [
      { role: 'agent', thinking: '在读证明办理' },
      { role: 'agent', text: `在读证明这个我可以帮你<b>闭环办理</b>：读取你的学籍档案 → 自动预填申请表 → 校验材料 → 提交并生成防伪二维码回执。` },
      { role: 'agent', text: `你（时钟 · 大二计算机科学）学籍正常，用途「考研/出国/实习」，中文 1 份，可到江湾校区一站式办事大厅自助打印。要我现在帮你提交吗？` },
      { role: 'agent', text: `去底部「聚合中心 → 证明办事」即可一键提交，办结后生成电子回执。` },
    ];
  }

  // 学习资料
  if (has('资料') || has('真题') || has('试卷') || has('高数') || has('数学') || has('ppt') || has('课件') || has('物理') || has('复习')) {
    const rs = RESOURCES.slice(0, 2);
    return [
      { role: 'agent', thinking: '在检索资料库' },
      { role: 'agent', sources: `<b>资源市场命中 ${RESOURCES.length} 份</b> · <span class="brand">闲鱼真题库</span>` },
      { role: 'agent', text: `按你说的，最相关的两份在这：` },
      { role: 'agent', resCards: rs },
      { role: 'agent', text: `资源市场支持「学科 / 老师 / 类型 / 年份」多维筛选，去聚合中心能按李教授、张老师等精准捞题。` },
    ];
  }

  // 二手
  if (has('二手') || has('显示器') || has('鼠标') || has('出') || has('买') || has('闲置') || has('ipad')) {
    return [
      { role: 'agent', thinking: '在搜校内好物' },
      { role: 'agent', sources: `<b>校内二手命中</b> · <span class="brand">安心流转</span>` },
      { role: 'agent', text: `这几个校内好物，成色和价格都标注了：` },
      { role: 'agent', thriftCards: THRIFT.slice(0, 2) },
    ];
  }

  // 报名 / 抢票 / 提醒
  if (has('报名') || has('抢') || has('票') || has('提醒') || has('闹钟') || has('别忘')) {
    return [
      { role: 'agent', thinking: '在查名额' },
      { role: 'agent', text: `报名这块交给我。可报名的（羽毛球局、西部大讲堂）点卡片「去报名」跳原链接；已满的（社区支教）我帮你开「抢票提醒」，一放票第一时间喊你。` },
      { role: 'agent', text: `你日历里已加的活动，我也都能提前 30 分钟提醒你。` },
    ];
  }

  // 搭子
  if (has('搭子') || has('羽毛球') || has('自习') || has('组队') || has('拼') || has('结伴')) {
    return [
      { role: 'agent', thinking: '在匹配同行' },
      { role: 'agent', sources: `<b>搭子场景命中</b> · <span class="brand">低压力同行</span>` },
      { role: 'agent', text: `这几个局跟你最搭：` },
      { role: 'agent', buddyCards: BUDDIES.slice(0, 2) },
    ];
  }

  // 运动类活动
  if (has('运动') || has('球')) {
    return [
      { role: 'agent', thinking: '在找' },
      { role: 'agent', text: `这周的运动类活动有这些：` },
      { role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-badminton')] },
      { role: 'agent', text: `羽毛球局今晚 18:00 江湾体育馆，还差 2 人，你 16:00 下课时间刚好。要我帮你报名还是加日历？` },
    ];
  }

  // 讲座
  if (has('讲座') || has('人文') || has('ai')) {
    return [
      { role: 'agent', thinking: '在找' },
      { role: 'agent', sources: `<b>找到 1 个讲座</b> · <span class="brand">复旦通识</span>` },
      { role: 'agent', text: `今晚这场挺推荐：<b>复旦西部大讲堂 · AI 与人文</b>，19:00 光华楼 202，免费入场。` },
      { role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-talk')] },
    ];
  }

  // 志愿
  if (has('志愿') || has('支教') || has('公益')) {
    return [
      { role: 'agent', thinking: '在找' },
      { role: 'agent', text: `周末有个社区支教志愿者招募，周六 09:00 杨浦社区中心。不过目前已经<b>报满</b>，我帮你开「抢票提醒」，一有补位马上通知你。` },
      { role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-volunteer')] },
    ];
  }

  // 演出
  if (has('演出') || has('话剧') || has('戏剧')) {
    return [
      { role: 'agent', thinking: '在找' },
      { role: 'agent', sources: `<b>找到 1 个演出</b> · <span class="brand">复旦剧社</span>` },
      { role: 'agent', text: `周五 19:30 相辉堂有话剧《雷雨》学生专场，现在还能报名。` },
      { role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-drama')] },
    ];
  }

  return [
    { role: 'agent', thinking: '在帮你规划' },
    { role: 'agent', sources: `<b>结合你的空档找到 3 个活动</b> · <span class="brand">课余</span>` },
    { role: 'agent', text: `按你的课表排了下，这三个最顺路：` },
    { role: 'agent', cards: [ALL_ACTIVITIES.find(a => a.id === 'a-badminton'), ALL_ACTIVITIES.find(a => a.id === 'a-talk'), ALL_ACTIVITIES.find(a => a.id === 'a-study')] },
    { role: 'agent', text: `你也可以跟我说「找高数真题」「办在读证明」「周六羽毛球搭子」，我能直接帮你落地。` },
  ];
}

// ============ Agent 云端对话（MiniMax） ============
// 部署 agent-chat 云函数后，把 HTTP 触发 URL 填到这里；留空则回退到本地关键词匹配
const AGENT_FN_URL = 'https://pengbi-d9g6dq0tobf99cd63-1424661943.ap-shanghai.app.tcloudbase.com/agentchat';
let agentHistory = [];

function buildAgentContext() {
  return {
    profile: getProfile(),
    activities: ALL_ACTIVITIES.map(({ id, title, type, host, time, place, status }) => ({ id, title, type, host, time, place, status })),
    resources: RESOURCES.map(({ id, subject, teacher, type, title }) => ({ id, subject, teacher, type, title })),
    thrift: THRIFT.map(({ id, cat, title, price, place }) => ({ id, cat, title, price, place })),
    buddies: BUDDIES.map(({ id, scene, title, need, time, place }) => ({ id, scene, title, need, time, place })),
  };
}

async function callAgentCloud(userText) {
  agentHistory.push({ role: 'user', content: userText });
  const res = await fetch(AGENT_FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: agentHistory, context: buildAgentContext() }),
  });
  if (!res.ok) throw new Error('云函数 HTTP ' + res.status);
  const data = await res.json();
  if (data.ok) agentHistory.push({ role: 'assistant', content: data.reply });
  return data;
}

function renderAgentResult(data) {
  const acts = (data.activityIds || []).map(id => ALL_ACTIVITIES.find(a => a.id === id)).filter(Boolean);
  const ress = (data.resourceIds || []).map(id => RESOURCES.find(r => r.id === id)).filter(Boolean);
  const ths = (data.thriftIds || []).map(id => THRIFT.find(t => t.id === id)).filter(Boolean);
  const buds = (data.buddyIds || []).map(id => BUDDIES.find(b => b.id === id)).filter(Boolean);

  appendMsg({ role: 'agent', text: data.reply });
  if (acts.length) appendMsg({ role: 'agent', cards: acts });
  if (ress.length) appendMsg({ role: 'agent', resCards: ress });
  if (ths.length) appendMsg({ role: 'agent', thriftCards: ths });
  if (buds.length) appendMsg({ role: 'agent', buddyCards: buds });
}

// 本地关键词兜底（云函数不可用 / 未部署时）
function renderLocalReplies(replies) {
  let i = 0;
  const step = () => {
    if (i >= replies.length) return;
    appendMsg(replies[i++]);
    setTimeout(step, 420);
  };
  step();
}

function initAgent() {
  const input = $('#agent-text');
  const send = $('#agent-send');
  const doSend = async (val) => {
    const text = (val ?? input.value).trim();
    if (!text) return;
    appendMsg({ role: 'user', text });
    input.value = '';
    send.disabled = true;

    // 未部署云函数 → 直接本地兜底
    if (!AGENT_FN_URL) {
      renderLocalReplies(replyFor(text));
      send.disabled = false;
      return;
    }

    const thinkingWrap = appendMsg({ role: 'agent', thinking: '正在理解你的需求…' });
    try {
      const data = await callAgentCloud(text);
      thinkingWrap.remove();
      if (data && data.ok) {
        renderAgentResult(data);
      } else {
        appendMsg({ role: 'agent', text: '云端 Agent 暂时不可用（' + ((data && data.error) || '未知错误') + '），我先按本地规则帮你：' });
        renderLocalReplies(replyFor(text));
      }
    } catch (e) {
      thinkingWrap.remove();
      appendMsg({ role: 'agent', text: '网络异常：' + e.message });
      renderLocalReplies(replyFor(text));
    }
    send.disabled = false;
  };
  send.addEventListener('click', () => doSend());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
  document.querySelectorAll('.agent-preset').forEach(chip => {
    chip.addEventListener('click', () => doSend(chip.dataset.q));
  });
}

// ============ 聚合中心 ============
function switchPanel(name) {
  document.querySelectorAll('.mod-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === 'panel-' + name));
  ['res', 'thrift', 'buddy', 'cert'].forEach(k => {
    const el = $('#panel-' + k);
    if (el) el.style.display = (k === name) ? 'block' : 'none';
  });
}

function initModTabs() {
  document.querySelectorAll('.mod-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPanel(tab.dataset.panel.replace('panel-', '')));
  });
}

function initModPanel() {
  // 首次进入聚合中心时渲染各面板
  if (!window._modRendered) {
    window._modRendered = true;
    renderResources();
    renderThrift();
    renderBuddies();
  }
}

// 资源市场渲染 + 闲鱼多维筛选
let fSubject = 'all', fTeacher = 'all', fTypes = new Set(), fYears = new Set();

function renderResources() {
  // 维度按钮
  const subs = [...new Set(RESOURCES.map(r => r.subject))];
  const teas = [...new Set(RESOURCES.map(r => r.teacher))];
  const types = [...new Set(RESOURCES.map(r => r.type))];
  const years = [...new Set(RESOURCES.map(r => r.year))].sort((a, b) => b - a);

  const pill = (v, active) => `<button class="fb-tag ${active ? 'active' : ''}" data-v="${v}">${v}</button>`;

  $('#filter-subjects').innerHTML = pill('全部', fSubject === 'all') + subs.map(s => pill(s, fSubject === s)).join('');
  $('#filter-teachers').innerHTML = pill('全部', fTeacher === 'all') + teas.map(t => pill(t, fTeacher === t)).join('');
  $('#filter-types').innerHTML = types.map(t => pill(t, fTypes.has(t))).join('');
  $('#filter-years').innerHTML = years.map(y => pill(y, fYears.has(y))).join('');

  applyResourceFilter();
}

function applyResourceFilter() {
  const flow = $('#res-cards-flow');
  let visible = RESOURCES.filter(r => {
    const mS = fSubject === 'all' || r.subject === fSubject;
    const mT = fTeacher === 'all' || r.teacher === fTeacher;
    const mTyp = fTypes.size === 0 || fTypes.has(r.type);
    const mY = fYears.size === 0 || fYears.has(r.year);
    return mS && mT && mTyp && mY;
  });

  flow.innerHTML = visible.map(r => `
    <div class="res-card" data-id="${r.id}">
      <div class="rc-top">
        <span class="rc-subj">${r.subject}</span>
        <span class="rc-year">${r.teacher} · ${r.year}年 · ${r.type}</span>
      </div>
      <div class="rc-title">${r.title}</div>
      <div class="rc-desc">${r.desc}</div>
      <div class="rc-tags">${r.tags.map(t => `<span class="rc-tag">${t}</span>`).join('')}</div>
      <div class="rc-bottom">
        <span class="rc-meta">${r.downloads} 次下载 · 评分 ${r.score}</span>
        <button class="rc-btn" data-id="${r.id}">获取资料</button>
      </div>
    </div>`).join('');

  const subStr = fSubject === 'all' ? '全部学科' : fSubject;
  const teaStr = fTeacher === 'all' ? '全部老师' : fTeacher;
  const typStr = fTypes.size === 0 ? '全部类型' : [...fTypes].join('+');
  const yrStr = fYears.size === 0 ? '全部年份' : [...fYears].join('+');
  $('#res-filter-summary').textContent = `${subStr} · ${teaStr} · ${typStr} · ${yrStr}`;
  $('#res-match-count').textContent = `共 ${visible.length} 份资料`;
}

function initResourceFilter() {
  const bind = (sel, kind) => {
    const wrap = $(sel);
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('.fb-tag');
      if (!btn) return;
      const v = btn.dataset.v;
      if (kind === 'subject') fSubject = v;
      else if (kind === 'teacher') fTeacher = v;
      else if (kind === 'type') { fTypes.has(v) ? fTypes.delete(v) : fTypes.add(v); }
      else if (kind === 'year') { fYears.has(v) ? fYears.delete(v) : fYears.add(v); }
      renderResources();
    });
  };
  bind('#filter-subjects', 'subject');
  bind('#filter-teachers', 'teacher');
  bind('#filter-types', 'type');
  bind('#filter-years', 'year');

  $('#res-filter-reset').addEventListener('click', () => {
    fSubject = 'all'; fTeacher = 'all'; fTypes.clear(); fYears.clear();
    renderResources();
  });

  $('#res-cards-flow').addEventListener('click', e => {
    const btn = e.target.closest('.rc-btn');
    if (btn) toast('资料获取中（demo）→ 下载链接已就绪');
  });
}

// 二手渲染
let fThriftCat = 'all';
function renderThrift() {
  const cats = ['all', ...new Set(THRIFT.map(t => t.cat))];
  const names = { all: '全部二手', 数码: '数码电子', 教材: '教材教辅', 生活: '宿舍生活', 运动: '骑行运动' };
  $('#thrift-cat-bar').innerHTML = cats.map(c => `<button class="fb-tag ${fThriftCat === c ? 'active' : ''}" data-cat="${c}">${names[c] || c}</button>`).join('');

  const list = THRIFT.filter(t => fThriftCat === 'all' || t.cat === fThriftCat);
  $('#thrift-grid-flow').innerHTML = list.map(t => `
    <div class="thrift-card" data-id="${t.id}">
      <div class="tc-img">${t.emoji}</div>
      <div class="tc-body">
        <div class="tc-tagrow"><span class="tc-cond">${t.cond} · ${t.cat}</span><span class="tc-place">${t.place}</span></div>
        <div class="tc-title">${t.title}</div>
        <div class="tc-bottom">
          <div class="tc-price">¥${t.price}<span class="orig">¥${t.orig}</span></div>
          <button class="tc-btn" data-id="${t.id}">联系卖家</button>
        </div>
      </div>
    </div>`).join('');
}

function initThrift() {
  $('#thrift-cat-bar').addEventListener('click', e => {
    const btn = e.target.closest('.fb-tag');
    if (!btn) return;
    fThriftCat = btn.dataset.cat;
    renderThrift();
  });
  $('#thrift-grid-flow').addEventListener('click', e => {
    const btn = e.target.closest('.tc-btn');
    if (btn) toast('已为你发起会话（demo）→ 联系卖家');
  });
}

// 搭子渲染
let fBuddyScene = 'all';
function renderBuddies() {
  const scenes = ['all', ...new Set(BUDDIES.map(b => b.scene))];
  const names = { all: '全部场景', 学习: '沉浸自习', 运动: '球类运动', 出行: '周末出游', 比赛: '竞赛组队' };
  $('#buddy-scene-bar').innerHTML = scenes.map(s => `<button class="fb-tag ${fBuddyScene === s ? 'active' : ''}" data-scene="${s}">${names[s] || s}</button>`).join('');

  const list = BUDDIES.filter(b => fBuddyScene === 'all' || b.scene === fBuddyScene);
  $('#buddy-cards-flow').innerHTML = list.map(b => `
    <div class="buddy-card" data-id="${b.id}">
      <div class="bc-top"><span class="bc-scene">${b.scene}场景</span><span class="bc-need">${b.need}</span></div>
      <div class="bc-title">${b.title}</div>
      <div class="bc-desc">${b.desc}</div>
      <div class="bc-meta">
        <span>${SVG_TIME}${b.time}</span>
        <span>${SVG_PIN}${b.place}</span>
      </div>
      <div class="bc-bottom"><span class="bc-host">发起人：${b.host}</span><button class="bc-btn" data-id="${b.id}">申请加入</button></div>
    </div>`).join('');
}

function initBuddies() {
  $('#buddy-scene-bar').addEventListener('click', e => {
    const btn = e.target.closest('.fb-tag');
    if (!btn) return;
    fBuddyScene = btn.dataset.scene;
    renderBuddies();
  });
  $('#buddy-cards-flow').addEventListener('click', e => {
    const btn = e.target.closest('.bc-btn');
    if (btn) toast('已提交入组申请（demo）→ 等待发起人确认');
  });
}

// 证明办事
function initCert() {
  $('#cert-apply-btn').addEventListener('click', () => {
    $('#cert-receipt-box').style.display = 'block';
    toast('申请已提交，回执已生成 ✅');
  });
}

// 快速发布（轻量弹窗）
function initPublishModal() {
  $('#open-create-modal').addEventListener('click', () => {
    let m = document.getElementById('pub-modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'pub-modal';
      m.className = 'pub-modal';
      m.innerHTML = `
        <div class="pm-mask"></div>
        <div class="pm-card">
          <div class="pm-head">
            <span>快速发布到聚合板块</span>
            <button class="pm-close">×</button>
          </div>
          <div class="pm-types" id="pm-types">
            <button class="fb-tag active" data-t="res">📚 资料</button>
            <button class="fb-tag" data-t="thrift">📦 二手</button>
            <button class="fb-tag" data-t="buddy">🤝 搭子</button>
          </div>
          <input class="pm-input" id="pm-title" placeholder="标题，如：高数真题 / 戴尔显示器 / 周六羽毛球">
          <div class="pm-actions">
            <button class="pm-cancel">取消</button>
            <button class="pm-submit" id="pm-submit">确认发布</button>
          </div>
        </div>`;
      document.body.appendChild(m);
      const close = () => m.remove();
      m.querySelector('.pm-mask').addEventListener('click', close);
      m.querySelector('.pm-close').addEventListener('click', close);
      m.querySelector('.pm-cancel').addEventListener('click', close);
      m.querySelectorAll('#pm-types .fb-tag').forEach(t => t.addEventListener('click', () => {
        m.querySelectorAll('#pm-types .fb-tag').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
      }));
      m.querySelector('#pm-submit').addEventListener('click', () => {
        const title = m.querySelector('#pm-title').value.trim();
        toast(title ? `已发布「${title}」（demo）` : '请先填写标题');
        if (title) m.remove();
      });
    }
  });
}

// ============ 我的 ============
function initMe() {
  document.querySelectorAll('.me-item').forEach(item => {
    item.addEventListener('click', () => {
      const label = item.textContent.replace(/→/g, '').trim();
      if (label.includes('待办')) openTodos();
      else if (label.includes('同行')) openGroups();
      else if (label.includes('权限') || label.includes('授权')) openPermissions();
      else if (label.includes('日志') || label.includes('回执')) openLogs();
      else if (label.includes('关于')) openAbout();
    });
  });
  const stats = document.querySelectorAll('.me-stats .ms-item');
  if (stats[0]) stats[0].addEventListener('click', openTodos);
  if (stats[1]) stats[1].addEventListener('click', () => { switchTab('publish'); switchPanel('res'); });
  if (stats[2]) stats[2].addEventListener('click', openGroups);
}

function openAbout() {
  let m = document.getElementById('about-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'about-modal';
    m.className = 'pub-modal';
    m.innerHTML = `
      <div class="pm-mask"></div>
      <div class="pm-card">
        <div class="pm-head"><span>关于课余</span><button class="pm-close">×</button></div>
        <div class="about-body">
          <div class="about-logo">课余 · 校园行动 Agent</div>
          <p class="about-desc">把通知与活动，转化为确定行动。一个面向复旦学子的校园行动助手：解析通知、匹配资料、找搭子、办证明，一站式搞定课余。</p>
          <div class="about-meta">版本 0.1 · 未来智造智能体大赛演示版</div>
        </div>
      </div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.querySelector('.pm-mask').addEventListener('click', close);
    m.querySelector('.pm-close').addEventListener('click', close);
  }
}

// ============ 通用子页面（深层页面） ============
function openSubpage(title, html) {
  $('#sp-title').textContent = title;
  $('#sp-body').innerHTML = html;
  $('#subpage').classList.add('open');
}
function closeSubpage() {
  $('#subpage').classList.remove('open');
}
function initSubpage() {
  $('#sp-back').addEventListener('click', closeSubpage);
}

// ---- 通知中心 ----
function openNotices() {
  const list = [
    { icon: '🔔', title: '抢票提醒：话剧《雷雨》放票了', sub: '学生专场余票已释放，凭校园卡免费领，先到先得。', time: '今天 10:00' },
    { icon: '⚠️', title: '时间冲突提醒', sub: '周五 18:30 讲座与大物实验补课存在潜在冲突，Agent 已标记替代方案。', time: '今天 09:30' },
    { icon: '✅', title: '在读证明已办结', sub: '已生成电子签章回执，可凭码至江湾大厅自助打印。', time: '昨天 20:00' },
    { icon: '📅', title: '活动即将开始', sub: '复旦西部大讲堂：AI 与人文，今晚 19:00 光华楼 202。', time: '昨天 18:00' },
    { icon: '🤝', title: '羽毛球局还差 2 人', sub: '你关注的周六气膜馆羽毛球双打局还差 2 人，点此加入。', time: '昨天 12:00' },
  ];
  openSubpage('通知中心', list.map(n => `
    <div class="sp-card" style="display:flex;gap:12px;align-items:flex-start;">
      <div class="sp-ico">${n.icon}</div>
      <div style="flex:1;min-width:0;">
        <div class="sc-title">${n.title}</div>
        <div class="sc-sub">${n.sub}</div>
        <div class="sc-time">${n.time}</div>
      </div>
    </div>`).join(''));
}

// ---- 我的待办 ----
function openTodos() {
  const todos = [
    { done: false, title: '话剧《雷雨》报名', sub: '报名截止今晚 23:59，凭校园卡免费领票', tag: '演出' },
    { done: false, title: '社区支教志愿者培训', sub: '周六前完成一次线上培训', tag: '志愿' },
    { done: true, title: '加入羽毛球约球', sub: '周六 18:00 江湾体育馆，球费 AA', tag: '运动' },
    { done: false, title: '高数作业提交', sub: '周五 23:59 前提交线上系统', tag: '学习' },
    { done: true, title: '办理在读证明', sub: '已办结，凭码自助打印', tag: '办事' },
  ];
  openSubpage('我的待办', todos.map(t => `
    <div class="sp-card sp-todo">
      <button class="sp-check ${t.done ? 'on' : ''}">${t.done ? '✓' : ''}</button>
      <div style="flex:1;min-width:0;">
        <div class="sc-title ${t.done ? 'strike' : ''}">${t.title}</div>
        <div class="sc-sub">${t.sub}</div>
      </div>
      <span class="sp-tag">${t.tag}</span>
    </div>`).join(''));
  document.querySelectorAll('.sp-todo').forEach(card => {
    card.querySelector('.sp-check').addEventListener('click', () => {
      const check = card.querySelector('.sp-check');
      const on = check.classList.toggle('on');
      check.textContent = on ? '✓' : '';
      card.querySelector('.sc-title').classList.toggle('strike', on);
      toast(on ? '已标记完成' : '已取消完成');
    });
  });
}

// ---- 同行小组 ----
function openGroups() {
  const groups = [
    { emoji: '🏸', title: '羽毛球约球', sub: '周六 18:00 江湾体育馆 · 还差 2 人', host: '羽毛球社' },
    { emoji: '🔭', title: '天文社观星夜', sub: '周六 20:00 江湾大草坪 · 15 人已加入', host: '天文协会' },
    { emoji: '📚', title: '跨院系学习小组', sub: '每晚 19:00 文图三楼 · 3 人已加入', host: '学习互助会' },
  ];
  openSubpage('我参与的同行小组', groups.map(g => `
    <div class="sp-card" style="display:flex;gap:12px;align-items:center;">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--green-soft);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none;">${g.emoji}</div>
      <div style="flex:1;min-width:0;">
        <div class="sc-title">${g.title}</div>
        <div class="sc-sub">${g.sub}</div>
      </div>
      <button class="sp-tag" style="border:none;cursor:pointer;background:var(--green);color:#fff;">进入</button>
    </div>`).join(''));
}

// ---- 权限与授权 ----
function openPermissions() {
  const perms = [
    { name: '通知解析', desc: '读取并解析你粘贴或授权的校园通知' },
    { name: '校历同步', desc: '同步复旦校历与作息时间' },
    { name: '课表读取', desc: '读取 UIS 课表用于冲突排查' },
    { name: '档案读取', desc: '读取学籍档案用于自动预填证明' },
    { name: '位置与校区', desc: '定位校区用于活动与搭子匹配' },
  ];
  openSubpage('权限与授权', perms.map(p => `
    <div class="sp-card sp-row">
      <div style="flex:1;min-width:0;">
        <div class="sc-title">${p.name}</div>
        <div class="sc-sub">${p.desc}</div>
      </div>
      <button class="sp-switch" role="switch" aria-checked="true"></button>
    </div>`).join('') + '<p style="font-size:11px;color:var(--ink-3);text-align:center;margin-top:4px;">所有授权仅在你主动触发时使用，可随时关闭</p>');
  document.querySelectorAll('.sp-switch').forEach(sw => {
    sw.addEventListener('click', () => {
      const off = sw.classList.toggle('off');
      sw.setAttribute('aria-checked', off ? 'false' : 'true');
      toast(off ? '已关闭该授权' : '已开启该授权');
    });
  });
}

// ---- 执行日志 ----
function openLogs() {
  const logs = [
    { time: '今天 18:02', action: '解析通知', detail: '「话剧《雷雨》学生专场」→ 生成报名行动' },
    { time: '今天 17:30', action: '匹配资料', detail: '「李教授高数真题」→ 命中 3 份资料' },
    { time: '昨天 20:00', action: '办结证明', detail: '在读证明 → CERT-20261028-0918 已出签章' },
    { time: '昨天 12:00', action: '加入日历', detail: '复旦西部大讲堂 → 已同步日程' },
  ];
  openSubpage('执行日志', logs.map(l => `
    <div class="sp-card" style="display:flex;gap:12px;align-items:flex-start;">
      <div class="sp-log-dot"></div>
      <div style="flex:1;min-width:0;">
        <div class="sc-title">${l.action}</div>
        <div class="sc-sub">${l.detail}</div>
        <div class="sc-time">${l.time}</div>
      </div>
      <span class="sp-log-status">成功</span>
    </div>`).join(''));
}

// ---- Agent 菜单 ----
function openAgentMenu() {
  let m = document.getElementById('agent-menu-pop');
  if (m) { m.remove(); return; }
  m = document.createElement('div');
  m.id = 'agent-menu-pop';
  m.className = 'agent-menu';
  m.innerHTML = `
    <div class="am-card">
      <button class="am-item" data-act="clear">🗑️ 清空对话</button>
      <button class="am-item" data-act="share">🔗 分享 App</button>
      <button class="am-item" data-act="about">ℹ️ 关于课余</button>
    </div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => {
    const act = e.target.closest('.am-item')?.dataset.act;
    if (act === 'clear') { $('#agent-dynamic').innerHTML = ''; toast('对话已清空'); }
    else if (act === 'share') toast('分享链接已复制（demo）');
    else if (act === 'about') openAbout();
    m.remove();
  });
  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', close); }
    });
  }, 0);
}

// ---- Agent 顶部：菜单 + 模式切换 + 头像 ----
function initAgentTopbar() {
  $('#agent-menu').addEventListener('click', openAgentMenu);
  const avatar = document.querySelector('#page-agent .avatar');
  if (avatar) avatar.addEventListener('click', () => switchTab('me'));
  const modes = document.querySelectorAll('.agent-modes .mode');
  modes.forEach((m, i) => {
    m.addEventListener('click', () => {
      modes.forEach(x => x.classList.remove('active'));
      m.classList.add('active');
      if (i === 0) { /* 行动模式：保持对话 */ }
      else if (i === 1) { switchTab('publish'); switchPanel('res'); }
      else if (i === 2) { switchTab('calendar'); }
    });
  });
}

// ---- 广场通知铃铛 ----
function initPlazaNotify() {
  const btn = $('#plaza-notify-btn');
  if (btn) btn.addEventListener('click', openNotices);
}

// ============ 启动 ============
function boot() {
  initSplash();
  initOnboarding();
  initTabs();
  initAgent();
  initAgentActions();
  initPlazaActions();
  initNavTiles();
  initAgentBanner();
  initModTabs();
  initResourceFilter();
  initThrift();
  initBuddies();
  initCert();
  initPublishModal();
  initEventDetail();
  initMe();
  initSubpage();
  initPlazaNotify();
  initAgentTopbar();
  renderPlaza();
  renderCalendar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
