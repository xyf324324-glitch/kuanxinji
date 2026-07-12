# 宽心纪

移动端优先、桌面端完整响应的「宽心纪｜愿您宽心」网站原型。当前主线聚焦最重要的产品闭环：

1. 氛围首页与随机文案
2. 答案之书的呼吸仪式、随机引文和全文阅读
3. 「此刻有什么想问？」的示例问题、自由输入和 1+2 文章推荐
4. 引文分享与 1080×1440 图片保存
5. 纯静态 PWA、离线书架、阅读进度和本地内容检索

## 本地开发

```bash
npm install
npm run dev
```

生产检查：

```bash
npm run lint
npm run content:check
npm run build
```

## 当前状态

- 唯一主项目：本目录；旧的 `kuanxin-react` 不再作为产品主线。
- 最终视觉源：`design/source-home-final.png`。
- 真实 Logo：`src/assets/kuanxin-logo-transparent.png`。
- 手机基准视口：390×844，同时提供桌面响应式展开。
- 晨雾主图已从约 1.45MB PNG 压缩为约 82KB JPEG，源 PNG 保留用于后续高质量再处理。
- 已从老师文案表格的 192 条记录中导入 190 篇有效文章；2条完全重复记录已跳过。所有内容保留公众号原文链接，状态为 `published-source / pending`，公开发布前仍需确认授权与抽样复核。
- 所有页面位于同一个站点，并使用 Hash 路由：`#/`、`#/search`、`#/answer/:id`、`#/article/:id`。部署为静态网站后无需额外服务器重写规则，文章链接可直接打开和刷新。
- 正式架构不依赖服务器或云数据库；内容位于 `src/content/`，收藏和阅读进度只保存在当前设备。
- 内容维护见 `CONTENT_GUIDE.md`，EdgeOne Pages 免费部署见 `DEPLOY_EDGEONE.md`。

## 文章数据要求

每篇文章至少需要以下字段：

```text
id
title
body
publishedAt
originalUrl
summary
themes[]
userConcerns[]
keywords[]
quotableExcerpts[]
sourceStatus
reviewStatus
```

前台「宽心提示」由导入程序从原文逐字提取，可追溯至公众号正文；未经人工抽样复核和授权确认，不应标记为 `authorized`。

## 提问寻文边界

- 原型只在当前浏览器会话中暂存问题，关闭会话后失效；不会发送到服务器。
- 提示语来自首篇推荐文章的引文，不自由模拟老师口吻。
- 结果按「1 篇最贴近 + 2 篇延伸」展示。
- 未命中时明确说明仅提供相近主题。
- 自伤、极度绝望、严重疾病等词会触发紧急求助提示。
- 正式版仍需服务端频率限制、风险规则、检索评估和去标识化统计。

## 上线前仍需完成

- 导入并审核正式授权内容。
- 为每篇文章配置真实公众号原文链接。
- 配置正式域名、HTTPS、ICP 备案和微信分享签名。
- 接入后端检索、限频与匿名统计。
- 补齐节气日历、经典阅读和关于/隐私/免责声明页面。
