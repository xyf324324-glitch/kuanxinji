# 宽心纪本地内容维护说明

网站不依赖数据库。所有公开内容都保存在 `src/content/`，随网页一起构建并由 PWA 缓存在用户设备。

## 目录

- `articles/`：老师文章，每篇一个 JSON。
- `classics/`：经典目录和后续章节内容。
- `solar-terms/`：二十四节气目录和后续养生内容。
- `content-version.json`：内容版本；每次正式发布内容时更新。

## 新增文章

1. 复制一篇现有文章 JSON，并把文件名改成稳定的英文或拼音 ID。
2. 修改标题、正文、标签、来源和审核状态。
3. 执行 `npm run content:check`。
4. 更新 `content-version.json`。
5. 执行 `npm run build`，确认无错误后发布 `dist/`。

## 字段约定

- `id`：永久不变，用于文章链接和本地阅读进度。
- `order`：列表顺序。
- `title`、`quote`、`paragraphs`：前台正文内容。
- `themes`、`keywords`、`userConcerns`：本地搜索使用。
- `sourceStatus`：`prototype`、`published-source`、`authorized` 或 `public-domain`。公众号表格导入内容使用 `published-source`，人工确认授权后再改为 `authorized`。
- `reviewStatus`：`pending`、`approved` 或 `rejected`。
- `sourceUrl`：公众号或正式来源链接；没有时保留空字符串。

经典现代译注、排版版本和老师文章在公开发布前必须确认授权。节气养生内容后续还需增加来源、审核人、审核日期、适用范围和健康提示。

## 本地数据说明

- 离线书架与阅读进度保存在 IndexedDB；不上传服务器。
- 不支持跨设备同步。
- 清除浏览器或微信缓存会删除本机书架。
- 向用户发布新版后，PWA 会提示更新；书架中的文章 ID 和阅读进度会继续保留。

## 从老师文案表格重新导入

```bash
npm run content:import -- "完整的xlsx文件路径"
npm run content:check
```

导入程序会保留公众号链接和完整正文，按原文生成宽心提示，并为本地搜索建立基础主题与关键词。完全重复的链接、标题和正文只保留一份；同名但内容不同的文章会继续保留。导入报告位于 `reports/content-import-report.json`。
