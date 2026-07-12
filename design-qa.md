# 首页视觉与交互 QA

## Evidence

- Source visual truth: `design/source-home-final.png`
- Browser-rendered implementation: `output/playwright/home-reference-final.png`
- Normalized side-by-side comparison: `output/playwright/home-final-comparison.png`
- Viewport: 390 × 844 CSS pixels
- State: 首页；每日禅语已关闭；默认首页文案
- Full-view comparison evidence: 参考图位于对照图左侧，实现位于右侧，两者使用相同裁切与视口比例。
- Focused comparison evidence: Logo/菜单、标题/祥云、圆形开启按钮、提问入口、底部弧面均可在全视图中清晰读取，无需额外局部放大。

## Required Fidelity Surfaces

- Fonts and typography: 中文宋体层级、标题字号、字距和小字号说明与参考一致；系统字体抗锯齿存在可接受的 P3 差异。
- Spacing and layout rhythm: Logo、标题、按钮、提问入口和底部弧面已按 853×1844 源图等比例映射到 390×844。
- Colors and visual tokens: 雾白、墨黑、暖橙/暖金与源图一致；无额外高饱和色。
- Image quality and asset fidelity: 使用官方透明 Logo、官方祥云切片、参考图直接提取的水墨按钮、压缩后的晨雾底图和参考图金色圆点；无占位素材。
- Copy and content: 默认文案、标题、提示和入口文字与参考图一致；底部文案可点击切换其他已审核前的原型文案。

## Comparison History

### Pass 1 — blocked

- [P1] Logo 白底形成矩形：已生成透明 PNG 并替换。
- [P1] 圆形按钮缺少水墨纹理：已从最终参考图提取独立按钮资产。
- [P2] 缺少标题下方祥云：已从官方 Logo 提取透明祥云资产。
- [P2] 提问入口低约 60px：已按参考图坐标上移。
- [P2] 底部弧面与文案位置偏低：已调整弧面高度、圆点和文案位置。

### Pass 2 — passed

- 前述 P1/P2 均已修复并在 `home-reference-final.png` 中复核。
- 参考图与实现的主要区域比例、背景裁切和视觉层级一致。

## Primary Interactions Tested

- 每日禅语自动出现并可关闭。
- 「开启答案之书」可进入随机引文结果。
- 结果可进入全文阅读页。
- 「此刻有什么想问？」可打开问题面板。
- 示例问题可填入并提交，返回 1 篇最贴近 + 2 篇延伸文章。
- 推荐文章可进入全文阅读页。
- Browser console: 0 errors, 0 warnings at the final homepage and core-flow checks.

## Findings

- No actionable P0/P1/P2 findings remain for the confirmed homepage.
- [P3] 菜单与提问入口的箭头造型受图标字体影响，与生成参考有轻微笔画差异，可在全站图标规范阶段统一。

## Follow-up Polish

- 桌面端完成后复核超宽屏背景裁切。
- 正式字体确定后再做一次中文字重与字距微调。

final result: passed

---

# 公众号文章批量导入 QA

## Evidence

- Source workbook: `C:/Users/WIN10/WPSDrive/350411431/WPS云盘/公众号赖老师文案链接.xlsx`
- Import report: `reports/content-import-report.json`
- Final mobile catalog: `output/playwright/article-catalog-190-final-mobile.png`
- Final imported article: `output/playwright/imported-article-top-final-mobile.png`
- Local-network preview: `http://192.168.0.46:4175/#/articles`

## Findings

- 192 spreadsheet records inspected; 190 unique articles imported and 2 exact duplicates skipped.
- No missing source URLs, titles or bodies; no duplicate article IDs.
- Same-title/different-content articles remain preserved.
- Repeated author signature paragraphs were removed from display content; author metadata remains.
- Catalog renders 20 articles initially and expands in groups of 20.
- Main application bundle reduced from 1.42 MB to approximately 403 KB by splitting article bodies into independent chunks; the full offline precache is approximately 2 MB.
- Search, direct article load, source URL, disconnected reload and responsive layout pass.
- Production build, lint and content validation pass; browser console: 0 errors, 0 warnings.
- No actionable P0/P1/P2 findings remain.

final result: passed

---

# 内容总览与老师文章库 QA

## Evidence

- Mobile content hub: `output/playwright/content-hub-mobile-390x844.png`
- Mobile article catalog: `output/playwright/article-catalog-mobile-390x844.png`
- Desktop content hub: `output/playwright/content-hub-desktop-1440x900.png`
- Viewports checked: 320, 390, 768 and 1440 CSS pixels wide.

## Findings

- Content hub establishes a clear hierarchy: teacher articles first, classics and solar terms as upcoming modules, offline library as a persistent destination.
- Article catalog supports local text search, strict theme filtering, reading-progress recall and offline-save controls.
- Content → catalog → article → catalog return path passes.
- No horizontal overflow across tested widths.
- Production build, lint and content validation pass; browser console: 0 errors, 0 warnings.
- No actionable P0/P1/P2 findings remain.

final result: passed

---

# 静态 PWA 与离线阅读最终 QA

## Evidence

- Production preview: `http://127.0.0.1:4174/`
- Offline library: `output/playwright/pwa-offline-final-390x844.png`
- Viewports checked: 320, 390, 768 and 1440 CSS pixels wide.
- States checked: home, search, article, saved library, reading progress, disconnected reload.

## Findings

- Service Worker controls the production page; manifest is present.
- Full network disconnection still permits page reload and saved-article reading.
- IndexedDB preserves saved article IDs and reading progress after reload.
- Local JSON ranking returns the expected article for the test query “我总是想起前任”.
- No horizontal overflow across the tested routes and widths.
- `content:check`, lint and production build pass; browser console: 0 errors, 0 warnings.
- No actionable P0/P1/P2 findings remain.

## Follow-up Polish

- [P3] Verify iOS Safari and the current WeChat WebView on physical devices after first public deployment; their cache eviction policy cannot be fully simulated in desktop Chromium.

final result: passed

---

# 整站响应式与路由最终 QA

## Evidence

- Source visual truth: `design/source-home-final.png`
- Normalized mobile comparison: `output/playwright/home-final-comparison.png`
- Desktop homepage: `output/playwright/home-desktop-1440x900-final.png`
- Desktop answer: `output/playwright/result-desktop-1440x900.png`
- Desktop search: `output/playwright/search-desktop-1440x900.png`
- Desktop article: `output/playwright/article-desktop-1440x900.png`
- Mobile direct-link reload: `output/playwright/article-deeplink-mobile-390x844.png`
- Viewports checked: 320, 390, 768, 1024 and 1440 CSS pixels wide.
- States checked: home, breathing, answer, search recommendations, article, direct article URL reload and source-aware return.

## Required Fidelity Surfaces

- Fonts and typography: mobile preserves the confirmed Song-style hierarchy; desktop uses the same families and optical hierarchy with capped content widths.
- Spacing and layout rhythm: mobile remains faithful to the selected reference; desktop intentionally presents the vertical artwork as a centered landscape scroll rather than distorting its aspect ratio.
- Colors and visual tokens: ink black, fog white and warm gold stay consistent across all views.
- Image quality and asset fidelity: official logo/cloud and the selected raster landscape/button assets are used; no placeholders remain.
- Copy and content: core product-flow copy is present; prototype authorization disclaimer remains visible; all three mock articles are explicitly non-production content.

## Findings

- No horizontal overflow at 320, 390, 768, 1024 or 1440 CSS pixels across all persistent routes.
- Hash routes survive reload and support direct article links without server rewrite configuration.
- Search-origin articles return to search; random-answer articles return to the answer page.
- Build and lint pass; browser console: 0 errors, 0 warnings.
- No actionable P0/P1/P2 findings remain.

## Follow-up Polish

- [P3] Replace system Song fallbacks with an approved licensed webfont after the formal brand font is selected.
- [P3] Configure production WeChat share cards after the public domain and official-account credentials are available.

final result: passed

---

# 提问结果页与文章阅读页 QA

## Evidence

- `output/playwright/search-result-mobile-390x844.png`
- `output/playwright/article-mobile-390x844.png`
- Viewport: 390 × 844 CSS pixels

## Findings

- 提问结果页完整显示推荐摘要和 1 + 2 推荐层级，没有截断主要操作。
- 文章页标题、正文、来源声明和继续阅读形成清晰的长文层级。
- 从提问结果进入文章后，「返回」会回到提问结果；来源状态已验证。
- Build、lint 通过；browser console: 0 errors, 0 warnings.
- No actionable P0/P1/P2 findings remain for this mobile pass.

final result: passed
