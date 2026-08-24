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

# 右侧纸页菜单实现 QA（待浏览器验收）

## Evidence

- Source visual truth: 已选效果图 1，右侧纸页侧窗（Image Gen 输出：`C:/Users/WIN10/.codex/generated_images/01a02e35-3dd2-7243-96ff-a61355689bad/exec-0bfaeb3c-0505-459e-a10f-c133049bb91d.png`）。
- Implementation source: `src/App.jsx`、`src/index.css`。
- Intended viewport/state: 390 × 844 CSS pixels；首页打开右侧菜单。
- Browser-rendered implementation screenshot: 未生成。当前会话没有可驱动的浏览器控制接口；本地预览已启动，但无法在本会话中截图或进行同画布视觉对比。
- Full-view and focused comparison evidence: blocked，缺少同状态浏览器截图。

## Implemented Behavior

- 首页山水与答案之书保持可见，菜单改为右侧约 76% 宽度的不透明纸面侧窗；左侧使用可点击暗色遮罩关闭。
- 导航按“此刻 / 慢慢读 / 随四时探索”分组；离线书架降级为底部工具入口。
- 菜单触发器新增 `aria-expanded` 与 `aria-controls`；打开后焦点进入首个菜单项，Escape 或关闭按钮/遮罩关闭后焦点回到触发器。
- 已通过 `npm run build` 与 `npm run lint`。

## Required Fidelity Surfaces

- Fonts and typography: 复用现有 Noto Serif SC / 宋体层级；需要浏览器截图确认实际字重、换行与小字可读性。
- Spacing and layout rhythm: CSS 以效果图的右侧纸页、细金线、分组留白为目标；需要 390 × 844 实际截图确认。
- Colors and visual tokens: 复用现有雾白、墨黑、暖金；不使用玻璃模糊和大阴影。
- Image quality and asset fidelity: 复用原项目的山水底图、Logo、祥云与水墨按钮；未新增占位资产。
- Copy and content: 组名与目的地已按选定效果图落地；需要实际截图核对中文排版。

## Findings

- [P1] Browser-rendered visual comparison unavailable。
  - Impact: 无法确认侧窗的真实宽度、滚动、文字折行、首页遮罩与选定效果图的视觉差异。
  - Fix: 在 390 × 844 视口打开本地预览，截取菜单打开态并与源图同画布对比；如有 P0/P1/P2 视觉差异，修复后复测。

## Implementation Checklist

1. 在浏览器中打开首页并打开菜单。
2. 验证遮罩、关闭按钮、Escape、首项聚焦与各路由按钮。
3. 在 390 × 844 截图并完成与源图的对比。
4. 将本节更新为浏览器证据与最终通过结果。

final result: blocked

---

## 对话页重构 QA（2026-08-23）

### Evidence

- Source visual truth: `design/source-chat-selected.png`，1506 × 1045 px。
- Browser-rendered implementation: `output/playwright/chat-redesign/chat-desktop-1506x1045-final.png`，1506 × 1045 CSS px / 1506 × 1045 px，`deviceScaleFactor: 1`。
- Full-view same-canvas comparison: `output/playwright/chat-redesign/chat-desktop-comparison-final.png`。
- Focused content comparison: `output/playwright/chat-redesign/chat-focus-content-comparison-final.png`。
- Focused composer comparison: `output/playwright/chat-redesign/chat-focus-composer-comparison-final.png`。
- Mobile welcome states: `output/playwright/chat-redesign/chat-mobile-430x932-final.png`、`output/playwright/chat-redesign/chat-mobile-390x844-final.png`、`output/playwright/chat-redesign/chat-mobile-360x800-final.png`、`output/playwright/chat-redesign/chat-mobile-320x568-final.png`。
- Short-phone scrolled state: `output/playwright/chat-redesign/chat-mobile-320x568-bottom-final.png`。
- Long-conversation state: `output/playwright/chat-redesign/chat-mobile-390x844-long-conversation-final.png`。
- Interaction evidence: `output/playwright/chat-redesign/chat-mobile-390x844-prompt-filled.png`、`output/playwright/chat-redesign/chat-mobile-390x844-send-response.png`。

### Required Fidelity Surfaces

- Fonts and typography: Song-style display/body hierarchy, three-line welcome copy, heading scale, label scale and prompt row typography align with the source. The remaining platform Song rasterization difference is P3 only.
- Spacing and layout rhythm: 102 px desktop header, 760 px content frame, 670 px prompt frame, 910 × 82 px composer, separators, gold left rule and circular send control align in the same-size comparison.
- Colors and visual tokens: warm ivory paper, ink text, restrained warm gold and translucent composer match the selected direction; the empty-state send button stays gold as shown in the source.
- Image quality and asset fidelity: official logo/cloud assets are retained. The lake artwork uses the real source raster and a derived transparent fade asset; no CSS/div placeholder art remains and the former rectangular image edge is removed.
- Copy and content: “慢慢说，我在听。”、the exact requested greeting, three prompt rows and the local-storage/professional-care notice are present.

### Comparison History

- Pass 1: [P1] composer exposed both the visually hidden label and placeholder; [P1] the disabled send button was gray instead of source gold; [P2] welcome text and prompt frame were too wide. Fixed the accessible hidden label, gold disabled state, greeting width/line wrap and frame measurements.
- Pass 2: [P2] desktop greeting/prompt typography and vertical rhythm drifted; [P2] the mist image had a hard rectangle edge. Corrected optical type scale, prompt spacing, composer position and added the derived transparent fade raster.
- Pass 3: [P1] long mobile conversations scrolled the header away; [P1] the final reply could sit behind the fixed composer. Replaced the chat overflow scroll container with clipping and added an active-thread end spacer; post-fix evidence keeps the header at `y=0` and the final reply above the composer.
- Pass 4: [P2] 320 × 568 initially allowed the fixed disclaimer to cover prompt text. The short-height rule now places the notice in document flow; all three 53 px prompt targets become fully visible after normal scrolling.

### Interaction And Responsive Checks

- Viewports checked: 1506 × 1045, 430 × 932, 390 × 844, 360 × 800 and 320 × 568.
- No horizontal overflow at the tested widths.
- Mobile tap targets: prompt rows 53 px high, send 46 × 46 px, header actions at least 44 px high.
- Prompt selection fills the textarea and enables send. A mocked 200 response verified submit → user message → assistant message. Restart restores the exact greeting. Long conversation and short-phone scrolling remain usable.
- Browser console: 0 errors, 0 warnings.
- Code checks: `git diff --check`、`npm run lint`、`npm run content:check`、`npm run build` passed.

### Follow-up Polish

- [P3] Replace system Song fallbacks with a licensed brand webfont once the formal font is approved; this will remove small cross-platform glyph-weight differences.

final result: passed

---

## Current QA State — 开启动效、阅读进度与右侧菜单（2026-08-23）

### Evidence

- `output/playwright/home-mobile.png`
- `output/playwright/opening-motion.png`
- `output/playwright/article-progress-fixed.png`
- `output/playwright/menu-drawer-mobile-fixed.png`
- Viewport: 390 × 844 CSS pixels

### Findings

- 首页“开启”完成按压、金色光圈扩散与 540ms 后进入呼吸仪式；真实点击链路已验证。
- 阅读页滚动进度实测随页面更新；滚至 88% 时，顶部栏 `headerTop = 0`，金色进度线保持可见。
- 修复文章页外层 `overflow` 导致粘性阅读栏随正文滚走的问题。
- 右侧菜单实测边界为 `left = 93.609px`、`right = 390px`，保持从屏幕右侧展开。
- 修复菜单初始聚焦触发横向滚动、导致侧窗错误偏到左侧的问题；当前父容器 `scrollLeft = 0`。
- 菜单打开后焦点进入首项，Escape 可关闭并返回触发按钮。
- Browser console: 0 errors, 0 warnings.
- 此处结果取代上方“右侧纸页菜单 blocked”状态。

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

---

## Current QA State — 右侧纸页菜单（2026-08-23）

- Source visual truth: 已选效果图 1（右侧纸页侧窗）。
- Implementation: `src/App.jsx`、`src/index.css`。
- Code checks: `npm run build`、`npm run lint` 已通过。
- Browser evidence: blocked。当前会话没有可驱动的浏览器控制接口；本地预览已启动，但未能在 390 × 844 菜单打开态截图，也未能与源图同画布对比。
- Required next check: 打开本地预览，验证遮罩/关闭/Escape/焦点与菜单路由，并截取菜单打开态完成视觉对比。

final result: blocked

---

## Current Build Gate — 对话页重构

- Detailed report: “对话页重构 QA（2026-08-23）” above.
- Source and final browser render were compared at identical 1506 × 1045 dimensions, with focused content/composer comparisons and four mobile widths.
- No actionable P0/P1/P2 findings remain for the chat redesign.

final result: passed

---

# 文章展示页重构 QA（2026-08-23）

## Evidence

- Source visual truth: `design/source-articles-selected.png`，1148 × 1372 px。
- Browser-rendered implementation: `output/playwright/articles-reference-size-1148x1372-final.png`，1148 × 1372 CSS px / 1148 × 1372 px，`deviceScaleFactor: 1`。
- Same-canvas comparison: `output/playwright/articles-design-comparison-final.png`；源图在左，实现图在右，两侧未经密度缩放。
- Mobile implementation: `output/playwright/articles-mobile-390x844-final.png`，390 × 844 CSS px。
- State: `#/articles`；“全部”筛选；搜索框为空；页面位于顶部。
- Focused evidence: 同尺寸全视图已能清晰读取标题、搜索、筛选、首篇精选与右侧阅读位置；手机适配另以 390 × 844 全视图复核，无需额外局部裁切。

## Required Fidelity Surfaces

- Fonts and typography: 沿用项目宋体 / Noto Serif SC 层级，并按源图调整标题、正文、小标签、行高与换行；系统宋体栅格差异仅属 P3。
- Spacing and layout rhythm: 顶栏、引导区、搜索线、主题筛选、结果状态、精选文章和普通文章的纵向节奏已在 1148 × 1372 同尺寸画布中对齐。
- Colors and visual tokens: 背景使用暖雾白 `#f8f5ef`，文字为墨色，交互和分隔为克制的暖金 / 铜色。
- Image quality and asset fidelity: 复用项目已有的品牌雾湖荷花实图并以低透明度融入背景，没有使用占位图或临时 CSS 插画。源图中更浓的水墨山体与现有品牌素材存在轻微 P3 风格差异。
- Copy and content: 标题为用户指定的“想读些什么？”，原副标题已删除；主题显示为“全部 / 情绪 / 困惑 / 修行 / 关系 / 生活”，“困惑”正确映射现有“因缘”文章数据。

## Comparison History

- Pass 1: [P1] 右侧阅读提示被通用按钮样式覆盖为普通文档流元素，导致首屏出现大块空白；增加页面级选择器后恢复固定侧轨。
- Pass 1: [P1] 顶栏未保持粘性；修复为带轻微纸面玻璃感的 sticky header。
- Pass 2: [P2] 手机精选标题被行数截断；取消精选标题钳制，完整显示标题。
- Pass 2: [P2] 桌面标题、筛选与精选文章的纵向间距偏离源图；在 1148 × 1372 视口逐段校准。
- Pass 3: [P2] 主题原显示数据标签“因缘”；改为用户确认的“困惑”，同时保留筛选功能。
- Pass 3: 旧 5173 开发会话发生样式 HMR 缓存异常；最终浏览器证据全部改用干净的 4173 本地会话复核。

## Primary Interactions And Responsive Checks

- 搜索输入“空性”可更新匹配数量；清空后恢复 211 篇。
- “困惑”筛选可用，实测返回 70 篇；“全部”可恢复完整文章集。
- 离线保存按钮可在保存 / 移除状态之间切换，`aria-pressed` 与可访问名称同步更新。
- 首篇文章可进入 `#/article/lai-888ee0bf3d58?from=articles`，浏览器返回后保持文章目录来源。
- 右侧阅读位置按钮实测平滑滚动至 `scrollY = 608`；进度点与页面滚动联动，且尊重 `prefers-reduced-motion`。
- 390 × 844 与 1148 × 1372 均无横向溢出；手机标题、筛选、精选全文和收藏按钮均未越界。
- Browser console: 0 errors, 0 warnings。
- Code checks: `git diff --check`、`npm run lint`、`npm run content:check`、`npm run build` passed。

## Findings

- No actionable P0/P1/P2 findings remain for the selected articles redesign.
- [P3] 若后续确定独立的山水品牌插画，可替换目前较淡的既有雾湖荷花背景，使右半部的水墨层次更接近效果图。

final result: passed
