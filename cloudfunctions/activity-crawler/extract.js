// 活动信息抽取（Node.js 版）—— 从标题 + 正文抽取结构化活动字段
// 字段对齐 PRD「找搭子」官方活动池：活动名 / 日期 / 时间 / 地点 / 校区 / 类型 / 报名方式 / 状态

const CATEGORY_RULES = [
  ['讲座', ['讲座', '论坛', '报告', '沙龙', '研讨', '分享会', '讲坛', '圆桌']],
  ['招新', ['招新', '纳新', '招募', '加入我们']],
  ['文艺演出', ['演出', '音乐会', '戏剧', '话剧', '歌会', '舞剧', '音乐剧', '晚会', '专场']],
  ['体育', ['体育', '运动会', '球赛', '篮球', '足球', '马拉松', '锻炼', '刷锻', '羽毛球', '乒乓']],
  ['志愿实践', ['志愿', '实践', '支教', '公益', '义工', '服务队']],
  ['招聘实习', ['招聘', '实习', '宣讲会', '内推', '就业', '校招', '选调']],
  ['比赛竞赛', ['竞赛', '大赛', '挑战杯', '比赛', '路演', '黑客松']],
  ['学术科研', ['学术', '科研', '课题', '论文', '导师', '实验室']],
  ['课程培训', ['课程', '培训', '训练营', '工作坊', '授课']],
  ['报名考试', ['报名', '考试', '四六级', '选课', '评教']],
];

const ONLINE_HINTS = ['线上', '腾讯会议', 'zoom', '钉钉', '直播', '云端'];
const REG_HINTS = ['报名', '扫码', '二维码', '报名链接', '填写', '问卷', '登记', '预约', '报名方式', '报名截止', '点击链接'];

// 复旦四大校区
const CAMPUS_RULES = [
  ['邯郸校区', ['邯郸', '本部', '邯郸路', '光华楼', '相辉堂', '逸夫', '东辅楼', '西辅楼', '六教', '五教', '三教', '四教', '二教', '一教', '文科楼', '理科楼', '叶耀珍', '正大体育馆', '旦苑']],
  ['枫林校区', ['枫林', '医学院', '枫林路', '西苑', '治道楼', '明道楼']],
  ['江湾校区', ['江湾', '江湾校区']],
  ['张江校区', ['张江', '张江校区']],
];

function normDate(year, month, day) {
  const now = new Date();
  let d;
  if (year == null) {
    d = new Date(now.getFullYear(), month - 1, day);
    if (d < new Date(now.getTime() - 200 * 86400000)) {
      d = new Date(now.getFullYear() + 1, month - 1, day);
    }
  } else {
    d = new Date(year, month - 1, day);
  }
  if (isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function extractActivity(title = '', content = '') {
  const text = (title || '') + '\n' + (content || '');
  const result = {
    dates: [], date_text: [], times: [], time_ranges: [],
    location: null, campus: null, online: null, registration: null,
    has_registration: false, categories: [], emails: [],
  };

  // 完整日期 2026/11/13 或 2026-11-13 或 2026年11月13日
  const fullDateRe = /(\d{4})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})\s*日?/g;
  let m;
  while ((m = fullDateRe.exec(text)) !== null) {
    const d = normDate(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
    if (d) { result.dates.push(d); result.date_text.push(m[0].trim()); }
  }
  // 月日 11月13日
  const mdRe = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;
  while ((m = mdRe.exec(text)) !== null) {
    const d = normDate(null, parseInt(m[1]), parseInt(m[2]));
    if (d) { result.dates.push(d); result.date_text.push(m[0].trim()); }
  }
  // 时间段 15:00-17:00
  const rangeRe = /(\d{1,2}):(\d{2})\s*[-—~至到]\s*(\d{1,2}):(\d{2})/g;
  while ((m = rangeRe.exec(text)) !== null) {
    result.time_ranges.push(`${m[1]}:${m[2]}-${m[3]}:${m[4]}`);
  }
  // 单点时间
  const timeRe = /(\d{1,2}):(\d{2})/g;
  while ((m = timeRe.exec(text)) !== null) {
    const hh = parseInt(m[1]), mm = parseInt(m[2]);
    if (hh <= 23 && mm <= 59) result.times.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  // 邮箱
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRe) || [];
  result.emails = [...new Set(emails)];

  // 线上判断
  result.online = ONLINE_HINTS.some((w) => text.toLowerCase().includes(w.toLowerCase()));

  // 地点抽取：优先「地点/地址/位置：XXX」，其次「在XX楼/教室/报告厅/会议室/校区」
  const locLabelRe = /(?:地点|地址|位置|活动地点|举办地点)\s*[:：]\s*([^\n，。；;]{2,40})/;
  let lm = text.match(locLabelRe);
  if (lm) {
    result.location = lm[1].trim();
  } else {
    const locPlaceRe = /([^\n，。；;]{0,20}(?:楼|教室|报告厅|会议室|剧场|音乐厅|体育馆|田径场|操场|广场|中心|书院|校区)[^\n，。；;]{0,10})/;
    let pm = text.match(locPlaceRe);
    if (pm) result.location = pm[1].trim();
  }

  // 校区识别
  for (const [campus, kws] of CAMPUS_RULES) {
    if (kws.some((kw) => text.includes(kw))) {
      result.campus = campus;
      break;
    }
  }
  if (result.online) {
    result.campus = result.campus || '线上';
    if (!result.location) result.location = '线上';
  }

  // 报名
  result.has_registration = REG_HINTS.some((w) => text.includes(w));
  if (result.has_registration) {
    for (const kw of ['报名方式', '报名链接', '扫码', '报名截止']) {
      const idx = text.indexOf(kw);
      if (idx >= 0) { result.registration = text.slice(idx, idx + 40).replace(/\n/g, ' ').trim(); break; }
    }
    if (!result.registration && result.emails.length) result.registration = '邮箱报名: ' + result.emails[0];
  }

  // 分类
  for (const [cat, kws] of CATEGORY_RULES) {
    if (kws.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) result.categories.push(cat);
  }

  // 去重排序
  result.dates = [...new Set(result.dates)].sort();
  result.date_text = [...new Set(result.date_text)];
  result.times = [...new Set(result.times)];
  return result;
}

// 判断活动状态：active（未过期/未知）/ expired（所有日期都早于今天）
function activityStatus(extracted) {
  const dates = (extracted && extracted.dates) || [];
  if (!dates.length) return 'active'; // 无日期不擅自判过期
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const allPast = dates.every((d) => d < todayStr);
  return allPast ? 'expired' : 'active';
}

module.exports = { extractActivity, activityStatus };
