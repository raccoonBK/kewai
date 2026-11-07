# -*- coding: utf-8 -*-
"""
搜狗微信搜索 + 公众号文章正文抓取模块

全链路（已实测验证）：
  1. 搜狗微信搜索 weixin.sogou.com/weixin?type=2&query=关键词
     -> 拿到文章列表（标题 / 公众号名 / 摘要 / 发布时间 / 跳转链接）
  2. 带 cookie 访问跳转链接 /link?url=...
     -> 返回 JS，从 JS 里拼接出 mp.weixin.qq.com/s?src=11&timestamp=..&signature=..
  3. 访问 src=11 地址
     -> 返回完整文章页，提取 activity-name（标题）+ js_content（正文）

仅依赖 Python 标准库（urllib + http.cookiejar + re + html），零第三方依赖，
方便直接部署到云函数。
"""
import re
import html
import json
import time
import urllib.request
import urllib.parse
import http.cookiejar

# 桌面端 UA 用于搜狗搜索；文章页用微信 UA 更稳
UA_DESKTOP = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
              "AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/120.0.0.0 Safari/537.36")
UA_WECHAT = ("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
             "AppleWebKit/605.1.15 (KHTML, like Gecko) "
             "Mobile/15E148 MicroMessenger/8.0.40")


class SogouWeixinCrawler:
    """搜狗微信搜索爬虫：搜文章 -> 解跳转 -> 抓正文"""

    def __init__(self, timeout=20):
        self.timeout = timeout
        self.blocked = False  # 是否触发搜狗反爬
        # 维护 cookie（SNUID / SUV 等），用于绕过搜狗反爬
        cj = http.cookiejar.CookieJar()
        self._opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(cj))
        self._referer = None

    # ---------- 底层 HTTP ----------

    def _get(self, url, ua=UA_DESKTOP, referer=None):
        req = urllib.request.Request(url)
        req.add_header("User-Agent", ua)
        req.add_header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        req.add_header("Accept-Language", "zh-CN,zh;q=0.9")
        req.add_header("Referer", referer or self._referer or "https://weixin.sogou.com/")
        with self._opener.open(req, timeout=self.timeout) as resp:
            return resp.read().decode("utf-8", "ignore")

    # ---------- 1. 搜索文章 ----------

    def search(self, query, page=1, page_size=10):
        """
        搜索公众号文章，返回文章列表。
        每条: {title, account, summary, publish_time, publish_ts, link}
        触发搜狗反爬（验证码）时返回空列表，并设置 self.blocked = True。
        """
        q = urllib.parse.quote(query)
        url = ("https://weixin.sogou.com/weixin?type=2&query={q}"
               "&page={page}&ie=utf8&s_from=input".format(q=q, page=page))
        text = self._get(url)
        # 反爬检测：返回验证码页 / antispider 页
        if ("VerifyCode" in text or "antispider" in text
                or "验证码" in text or "seccode" in text.lower()):
            self.blocked = True
            return []
        self.blocked = False
        results = []
        for m in re.finditer(
                r'<li id="sogou_vr_11002601_box_\d+"(.*?)</li>', text, re.S):
            block = m.group(1)
            item = self._parse_result_block(block)
            if item and item["title"]:
                results.append(item)
        return results

    @staticmethod
    def _parse_result_block(block):
        item = {}
        # 标题（去除 <em> 高亮标签）
        t = re.search(r'<h3>.*?<a[^>]*>(.*?)</a>', block, re.S)
        if t:
            title = re.sub(r"<[^>]+>", "", t.group(1))
            item["title"] = html.unescape(title).strip()
        # 跳转链接（HTML 里空格是原始空格，需转成 %20 才能请求）
        lk = re.search(r'href="(/link\?url=[^"]+)"', block)
        if lk:
            item["link"] = ("https://weixin.sogou.com"
                            + html.unescape(lk.group(1)).replace(" ", "%20"))
        # 公众号名
        ac = re.search(r'<span class="all-time-y2">([^<]*)</span>', block)
        if ac:
            item["account"] = html.unescape(ac.group(1)).strip()
        # 摘要
        sm = re.search(r'<p class="txt-info"[^>]*>(.*?)</p>', block, re.S)
        if sm:
            item["summary"] = html.unescape(
                re.sub(r"<[^>]+>", "", sm.group(1))).strip()
        # 发布时间（unix 秒时间戳）
        ts = re.search(r"timeConvert\('(\d+)'\)", block)
        if ts:
            item["publish_ts"] = int(ts.group(1))
            item["publish_time"] = time.strftime(
                "%Y-%m-%d", time.localtime(int(ts.group(1))))
        return item

    # ---------- 2. 解跳转（/link -> 真实 mp.weixin URL）----------

    def resolve(self, link_url):
        """
        访问搜狗 /link?url=... 跳转页，从 JS 拼接出真实 mp.weixin.qq.com 地址。
        需要先访问过搜索页（拿到 cookie），否则会被反爬拦截。
        """
        text = self._get(link_url, referer="https://weixin.sogou.com/")
        # JS 里真实地址被拆成多个 url += 'xxx' 片段
        parts = re.findall(r"url \+= '([^']*)'", text)
        if not parts:
            # 也可能是直接的 mp.weixin 链接
            direct = re.search(r"https?://mp\.weixin\.qq\.com[^\"']*", text)
            if direct:
                return direct.group(0)
            return None
        full = "".join(parts).replace("@", "")
        return full

    # ---------- 3. 抓正文 ----------

    def fetch_article(self, url):
        """
        抓取公众号文章正文。
        返回 {title, author, account, content, publish_time, images}
        """
        text = self._get(url, ua=UA_WECHAT,
                         referer="https://weixin.sogou.com/")
        art = {}
        # 标题
        t = re.search(r'id="activity-name"[^>]*>(.*?)</h1>', text, re.S)
        if t:
            art["title"] = html.unescape(
                re.sub(r"<[^>]+>", "", t.group(1))).strip()
        # 作者 / 公众号
        a = re.search(r'id="js_name"[^>]*>(.*?)</a>', text, re.S)
        if a:
            art["account"] = html.unescape(
                re.sub(r"<[^>]+>", "", a.group(1))).strip()
        # 发布时间
        p = re.search(r'id="publish_time"[^>]*>(.*?)</em>', text, re.S)
        if p:
            art["publish_time"] = html.unescape(
                re.sub(r"<[^>]+>", "", p.group(1))).strip()
        # 正文
        c = re.search(r'id="js_content"[^>]*>(.*?)</div>\s*<script', text, re.S)
        if c:
            # 保留段落结构，去掉标签
            raw = re.sub(r"<br[^>]*>", "\n", c.group(1))
            raw = re.sub(r"</p>", "\n", raw)
            raw = re.sub(r"<[^>]+>", "", raw)
            art["content"] = html.unescape(raw).strip()
        else:
            # 有些文章 js_content 后面不是 script，退回更宽松的匹配
            c2 = re.search(r'id="js_content"[^>]*>(.*?)</div>', text, re.S)
            if c2:
                raw = re.sub(r"<br[^>]*>", "\n", c2.group(1))
                raw = re.sub(r"</p>", "\n", raw)
                raw = re.sub(r"<[^>]+>", "", raw)
                art["content"] = html.unescape(raw).strip()
        # 图片
        art["images"] = re.findall(
            r'data-src="(https?://mmbiz\.qpic\.cn[^"]+)"', text)
        return art

    # ---------- 组合：搜索并抓取 ----------

    def search_and_fetch(self, query, page=1, max_articles=5):
        """搜索 + 解跳转 + 抓正文，一步到位。"""
        out = []
        for item in self.search(query, page=page):
            if len(out) >= max_articles:
                break
            if not item.get("link"):
                continue
            try:
                real = self.resolve(item["link"])
                if not real:
                    continue
                art = self.fetch_article(real)
                item["real_url"] = real
                item["article"] = art
                out.append(item)
            except Exception as e:
                item["error"] = str(e)
                out.append(item)
            time.sleep(1.0)  # 限速，避免触发反爬
        return out
