# -*- coding: utf-8 -*-
"""
活动信息抽取模块：从公众号文章标题 + 正文中抽取结构化活动字段。

抽取字段：
  - 活动日期（规范化 + 原文）
  - 活动时间（时:分）
  - 地点（线上/线下）
  - 报名方式
  - 活动分类标签
  - 面向对象
  - 报名截止

MVP 用规则 + 关键词抽取，LLM 结构化抽取作为后续增强层。
"""
import re
import datetime


# ---------- 分类关键词 ----------

CATEGORY_RULES = [
    ("讲座", ["讲座", "论坛", "报告", "沙龙", "研讨", "分享会", "talk", "讲坛", "圆桌"]),
    ("招新", ["招新", "纳新", "招募", "加入我们", "纳新"]),
    ("文艺演出", ["演出", "音乐会", "戏剧", "话剧", "歌会", "舞剧", "音乐剧", "晚会", "专场"]),
    ("体育", ["体育", "运动会", "球赛", "篮球", "足球", "马拉松", "锻炼", "刷锻", "羽毛球", "乒乓"]),
    ("志愿实践", ["志愿", "实践", "支教", "公益", "义工", "无偿", "服务队"]),
    ("招聘实习", ["招聘", "实习", "宣讲会", "内推", "就业", "校招", "选调"]),
    ("比赛竞赛", ["竞赛", "大赛", "挑战杯", "比赛", "路演", "黑客松", "hackathon"]),
    ("学术科研", ["学术", "科研", "课题", "论文", "导师", "实验", "实验室"]),
    ("课程培训", ["课程", "培训", "训练营", "workshop", "工作坊", "授课"]),
    ("报名考试", ["报名", "考试", "四六级", "FET", "选课", "评教"]),
]


# ---------- 日期 / 时间 ----------

RE_FULL_DATE = re.compile(
    r"(\d{4})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})\s*日?")
RE_MD_DATE = re.compile(r"(\d{1,2})\s*月\s*(\d{1,2})\s*日")
RE_WEEKDAY = re.compile(r"周[一二三四五六日天]")
RE_TIME = re.compile(r"(\d{1,2}):(\d{2})")
RE_TIME_RANGE = re.compile(r"(\d{1,2}):(\d{2})\s*[-—~至到]\s*(\d{1,2}):(\d{2})")

# 地点关键词（出现即认为可能包含地点）
LOCATION_HINTS = ["楼", "教室", "厅", "堂", "馆", "校区", "线上", "线下",
                  "腾讯会议", "zoom", "ZOOM", "钉钉", "会议室", "广场", "剧场",
                  "报告厅", "体育馆", "草坪", "食堂", "书院", "地点", "地址"]
ONLINE_HINTS = ["线上", "腾讯会议", "zoom", "ZOOM", "钉钉", "直播", "云端"]

# 报名关键词
REG_HINTS = ["报名", "扫码", "二维码", "报名链接", "填写", "问卷", "登记",
             "预约", "报名方式", "报名截止", "点击链接", "邮箱报名"]
REG_EMAIL = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")


def _norm_date(year, month, day):
    """把年月日规范成 YYYY-MM-DD，缺失年份用当前年份推断。"""
    now = datetime.date.today()
    if year is None:
        # 用当前年 + 未来推断：若该月日已过，则可能跨年
        try:
            d = datetime.date(now.year, month, day)
        except ValueError:
            return None
        if d < now - datetime.timedelta(days=200):
            d = datetime.date(now.year + 1, month, day)
        return d.strftime("%Y-%m-%d")
    try:
        d = datetime.date(int(year), int(month), int(day))
        return d.strftime("%Y-%m-%d")
    except ValueError:
        return None


def extract_activity(title="", content=""):
    """从标题+正文抽取活动结构化字段。"""
    text = (title or "") + "\n" + (content or "")
    result = {
        "dates": [],       # 规范化日期列表
        "date_text": [],   # 原文日期片段
        "times": [],       # 时间列表
        "time_ranges": [], # 时间段
        "location": None,
        "online": None,
        "registration": None,
        "has_registration": False,
        "categories": [],
        "emails": [],
    }

    # 完整日期
    for m in RE_FULL_DATE.finditer(text):
        d = _norm_date(m.group(1), m.group(2), m.group(3))
        if d:
            result["dates"].append(d)
            result["date_text"].append(m.group(0).strip())

    # 月日日期（不含年）
    for m in RE_MD_DATE.finditer(text):
        month, day = int(m.group(1)), int(m.group(2))
        d = _norm_date(None, month, day)
        if d:
            result["dates"].append(d)
            result["date_text"].append(m.group(0).strip())

    # 时间段优先
    for m in RE_TIME_RANGE.finditer(text):
        result["time_ranges"].append(f"{m.group(1)}:{m.group(2)}-{m.group(3)}:{m.group(4)}")

    # 单点时间
    for m in RE_TIME.finditer(text):
        hh = int(m.group(1)); mm = int(m.group(2))
        if 0 <= hh <= 23 and 0 <= mm <= 59:
            result["times"].append(f"{hh:02d}:{mm:02d}")

    # 邮箱
    result["emails"] = list(set(REG_EMAIL.findall(text)))

    # 线上判断
    if any(w in text for w in ONLINE_HINTS):
        result["online"] = True

    # 报名
    result["has_registration"] = any(w in text for w in REG_HINTS)
    if result["has_registration"]:
        # 提取报名方式短句
        for kw in ["报名方式", "报名链接", "扫码", "报名截止"]:
            idx = text.find(kw)
            if idx >= 0:
                snippet = text[idx:idx + 40].replace("\n", " ").strip()
                result["registration"] = snippet
                break
        if not result["registration"] and result["emails"]:
            result["registration"] = "邮箱报名: " + result["emails"][0]

    # 分类
    for cat, kws in CATEGORY_RULES:
        if any(kw.lower() in text.lower() for kw in kws):
            result["categories"].append(cat)

    # 去重 + 排序日期
    result["dates"] = sorted(set(result["dates"]))
    result["date_text"] = list(dict.fromkeys(result["date_text"]))
    result["times"] = list(dict.fromkeys(result["times"]))

    return result
