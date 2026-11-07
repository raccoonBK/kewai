# -*- coding: utf-8 -*-
"""
公众号活动自动抓取 - 主流程

流程：关键词搜索（搜狗）-> 解跳转 -> 抓正文 -> 抽取活动信息 -> 输出结构化 JSON

本地可直接运行验证；部署到云函数时作为定时触发器入口。
"""
import json
import time
import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sogou import SogouWeixinCrawler
from extract import extract_activity

# 活动搜索关键词（面向复旦校园活动的"官方活动池"）
# 关键词会自动附加当前年份（如 "2026"），强制搜狗返回近期文章
ACTIVITY_KEYWORDS = [
    "复旦 活动 报名",
    "复旦 讲座 报名",
    "复旦 招新",
    "复旦 志愿者 招募",
    "复旦 演出",
    "复旦 比赛 报名",
    "复旦 学术 讲座",
    "复旦 社团 活动",
    "复旦 论坛",
    "复旦 训练营",
]

# 每关键词最多抓取的文章数
MAX_PER_KEYWORD = 5
# 搜索翻页数（每页 10 条）
PAGES = 2
# 只保留最近 N 天发布的文章（活动池需要"新鲜"）
RECENT_DAYS = 60


def build_keywords(base=None):
    """基础关键词 + 附加当前年份，强制近期结果。"""
    base = base or ACTIVITY_KEYWORDS
    year = str(datetime.date.today().year)
    out = []
    for kw in base:
        out.append(f"{kw} {year}")
    return out


def crawl_activities(keywords=None, max_per_keyword=MAX_PER_KEYWORD,
                     recent_days=RECENT_DAYS, pages=PAGES, sleep=1.0):
    """抓取活动列表，返回结构化结果。"""
    keywords = keywords or build_keywords()
    crawler = SogouWeixinCrawler()
    cutoff = time.time() - recent_days * 86400
    activities = []
    seen = set()

    for kw in keywords:
        for page in range(1, pages + 1):
            try:
                results = crawler.search(kw, page=page)
            except Exception as e:
                print(f"[跳过] {kw} page{page}: {e}")
                continue

            for item in results:
                # 过滤过期文章
                if item.get("publish_ts", 0) < cutoff:
                    continue
                # 去重（按标题）
                key = item.get("title", "")
                if key in seen:
                    continue
                seen.add(key)

                act = {
                    "keyword": kw,
                    "title": item.get("title"),
                    "account": item.get("account"),
                    "summary": item.get("summary"),
                    "publish_time": item.get("publish_time"),
                    "publish_ts": item.get("publish_ts"),
                }
                # 抓正文 + 抽取
                if item.get("link"):
                    try:
                        real = crawler.resolve(item["link"])
                        if real:
                            art = crawler.fetch_article(real)
                            act["real_url"] = real
                            act["article"] = {
                                "title": art.get("title"),
                                "account": art.get("account"),
                                "publish_time": art.get("publish_time"),
                                "content": (art.get("content") or "")[:4000],
                            }
                            act["extracted"] = extract_activity(
                                act["title"], art.get("content") or "")
                    except Exception as e:
                        act["error"] = str(e)
                activities.append(act)
                time.sleep(sleep)

    return activities


def load_accounts():
    """加载公众号名单（data/accounts.json，来自那份复旦公众号清单）。"""
    p = os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), "data", "accounts.json")
    with open(p, encoding="utf-8") as f:
        return json.load(f).get("accounts", [])


def _account_match(target, got):
    """判断搜狗返回的文章所属公众号是否匹配目标公众号。
    搜狗显示的账号名可能与清单名不完全一致（别名/简称），做双向包含匹配。"""
    if not target or not got:
        return True  # 拿不到账号名时不过滤
    t = target.replace(" ", "").replace("（", "(").replace("）", ")")
    g = got.replace(" ", "").replace("（", "(").replace("）", ")")
    return (t in g) or (g in t) or (t == g)


def crawl_by_accounts(accounts=None, recent_days=RECENT_DAYS,
                      max_per_account=3, sleep=4.0, cooldown=120):
    """
    按公众号名逐个搜索，抓取每个公众号最近发布的文章。
    这是「直接盯公众号」的正路：微信公众号主页/历史文章接口无登录会返回
    no session，只能靠搜狗按公众号名精确搜索拿到该号最近发文。
    """
    accounts = accounts or load_accounts()
    crawler = SogouWeixinCrawler()
    cutoff = time.time() - recent_days * 86400
    activities = []
    seen = set()

    for i, acc in enumerate(accounts):
        name = (acc.get("name") or "").strip()
        if not name:
            continue
        print(f"[{i + 1}/{len(accounts)}] 「{name}」", flush=True)
        try:
            results = crawler.search(name)
        except Exception as e:
            print(f"    搜索异常: {e}")
            continue
        if crawler.blocked:
            print(f"    触发反爬，冷却 {cooldown}s ...", flush=True)
            time.sleep(cooldown)
            crawler.blocked = False
            try:
                results = crawler.search(name)
            except Exception as e:
                print(f"    冷却后仍异常: {e}")
                continue

        matched = 0
        for item in results:
            if item.get("publish_ts", 0) < cutoff:
                continue
            if not _account_match(name, item.get("account", "")):
                continue
            if item.get("title") in seen:
                continue
            if matched >= max_per_account:
                break
            matched += 1
            seen.add(item.get("title"))

            act = {
                "source_account": name,
                "title": item.get("title"),
                "account": item.get("account"),
                "summary": item.get("summary"),
                "publish_time": item.get("publish_time"),
                "publish_ts": item.get("publish_ts"),
            }
            # 抓正文 + 抽取
            if item.get("link"):
                try:
                    real = crawler.resolve(item["link"])
                    if real:
                        art = crawler.fetch_article(real)
                        act["real_url"] = real
                        act["article"] = {
                            "title": art.get("title"),
                            "account": art.get("account"),
                            "publish_time": art.get("publish_time"),
                            "content": (art.get("content") or "")[:4000],
                        }
                        act["extracted"] = extract_activity(
                            act["title"], art.get("content") or "")
                except Exception as e:
                    act["error"] = str(e)
            activities.append(act)
            time.sleep(sleep)
        time.sleep(sleep)

    return activities


def main():
    print("=== 复旦公众号活动抓取（按公众号逐个盯）===")
    accounts = load_accounts()
    print(f"公众号名单: {len(accounts)} 个")
    activities = crawl_by_accounts(accounts)
    print(f"\n共抓取 {len(activities)} 条近期活动\n")

    # 打印摘要
    for i, a in enumerate(activities):
        ex = a.get("extracted", {})
        dates = ", ".join(ex.get("dates", [])[:3]) or "未识别日期"
        cats = "/".join(ex.get("categories", [])) or "未分类"
        print(f"{i+1}. [{a['publish_time']}] {a['account']}")
        print(f"   {a['title'][:50]}")
        print(f"   活动日期: {dates} | 分类: {cats} | 报名: {ex.get('has_registration')}")
        print()

    # 保存结果
    out_path = os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), "data", "activities_sample.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(activities, f, ensure_ascii=False, indent=2)
    print(f"结果已保存: {out_path}")


if __name__ == "__main__":
    main()
