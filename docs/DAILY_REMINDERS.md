# 宽心每日提醒

仓库现已包含玻璃邀请卡、导航设置、推送客户端和 `reminder-service/` 独立 Cloudflare Worker 后端。**本地验证通过不代表生产推送已接通；必须完成 Workers / D1 授权、部署、Pages 绑定，并在真实 iPhone 验收后才能宣布跑通。** 不要把授予通知权限或保存本地时间视为订阅成功。

## 交互

- 进入首页立即出现；关闭 / 暂不开启只影响当前页面生命周期，刷新或重新打开再次出现。站内往返不重复打扰。
- 只有浏览器有效订阅和服务端开启状态均被确认，才不再自动邀请。
- 邀请卡不显示时间；首页导航 → 每日提醒中可调整时间、开启或关闭。
- 默认念佛：09:00 / 21:00；一念回光：09:00 / 13:00 / 21:00。按设备 IANA 时区提交，服务端必须按当地日历时间调度，处理夏令时。
- 同一时刻的两项练习建议合并为一条通知，避免 09:00 和 21:00 各收到两条。
- 未接通服务时，开启按钮给出明确提示；不申请无效权限、不显示虚假成功、不用页面定时器模拟后台推送。
- iPhone / iPad 需先添加主屏幕，从桌面启动后由用户点击开启。

## 待接通的同源接口

响应必须为 `application/json` 且包含 `ok: true`。其他响应（包括静态主机回退的 HTML）均视为不可用；不得缓存设备订阅状态。

| 路径 | 方法 | 请求 / 成功响应 |
| --- | --- | --- |
| `/api/reminders/config` | GET | `{ ok: true, enabled: true, publicKey: "<VAPID public key>" }`；调度未就绪必须返回 enabled: false |
| `/api/reminders/status` | POST | 请求 subscription；响应 enabled、times |
| `/api/reminders/subscribe` | POST | 请求 subscription、times、timeZone；持久化并确认调度后才返回 enabled: true、times |
| `/api/reminders/schedule` | POST | 请求 subscription、times、timeZone；响应 enabled: true、times |
| `/api/reminders/unsubscribe` | POST | 请求 subscription；取消该设备调度后响应 enabled: false |

`subscription` 是浏览器 `PushSubscription.toJSON()`；`times` 示例：

```json
{ "nianfo": ["09:00", "21:00"], "huiguang": ["09:00", "13:00", "21:00"] }
```

后端使用包含 endpoint 和两项订阅密钥的 SHA-256 标识隔离设备；校验时区、时间与条数。只向受支持的 Apple / Google / Mozilla / Windows 推送主机发送，禁止重定向。数据库与 VAPID 私钥仅保存在服务端。唯一投递记录防止同刻重复任务，404 / 410 会删除失效订阅。超过五分钟的过期任务跳过；网络结果不明确时不盲目重发。最近七天投递记录用于排错，不记录密钥或正文。

`/api/reminders/test` 在订阅开启后安排约 1–2 分钟后的测试通知，每设备一分钟最多一次。测试也由后台 Cron 发送，可以关页面或锁屏验证。生产 config 仅在密钥齐全且最近三分钟内有 Cron 心跳时返回 enabled:true。

## 正式部署（唯一网站目标）

- 网站：`https://kuanxinji.pages.dev`，仓库 `xyf324324-glitch/kuanxinji` 的 `main`。不要部署到同名 Sites 网站。
- 提醒 Worker：`kuanxinji-reminders`，关闭公共 workers.dev / 预览 URL，只通过 Pages 的 `REMINDER_SERVICE` 服务绑定调用。
- D1：`kuanxinji-reminders`；每分钟执行一次 Cron。数据库订阅和密钥需要保留，重复部署不得轮换 VAPID。
- `reminder-service` 中先 `npm ci`，用 Wrangler 官方 OAuth 登录取得 `account:read user:read workers_scripts:write workers:write d1:write pages:write`，再执行 `node deploy.mjs`。脚本创建数据库、初始化表、首次生成密钥并通过 stdin 写入 Cloudflare Secret、部署 Worker、为 Pages 生产与预览配置绑定。登录凭据不进入仓库。首次部署需确认 Wrangler 创建新 Worker 的提示；之后部署复用原密钥。
- 发布本次 Pages 源码后，检查同源 `/api/reminders/config` 为 JSON 且 enabled:true。Cron 配置传播可能需要等待；不要提前显示成功。首次开通若没有 enabled:true，先检查 Worker Cron 及绑定，禁止绕过检查。

## iPhone 验收

1. iOS 16.4 及以后，从 Safari 添加主屏幕；从主屏幕图标启动宽心纪。
2. 点击开启每日提醒并允许系统通知，服务端确认后显示成功。
3. 设置中点击发送测试通知，锁屏等待，再另做一次切换到其他应用的测试。通知标题为「宽心的提醒」，正文按项目显示。
4. 修改时间到接下来几分钟，确认手机当地时间调度；09:00 / 21:00 默认合并为一条，13:00 只有一念回光。
5. 关闭提醒后确认后续测试和日程不再发送；重新打开页面不会把单独的权限授予当成已订阅。

真实 iPhone 的展示、网络送达和专注模式不能用本地模拟替代。系统决定锁屏 / 横幅 / 通知中心的展示；网页不能强行控制。

PWA 的 `public/reminder-push.js` 已接入生成的 worker。推送内容支持 `{ "kind": "nianfo" }`、`{ "kind": "huiguang" }`，缺省为合并提醒。通知点击回首页，标题、正文使用固定站内文案。

单文件构建不包含 PWA，因此不会把它当作可成功订阅的安装包。

## 本地检查

```text
node --test scripts/reminders.test.mjs
npm --prefix reminder-service test
npm run lint
npm run build
```

## 2026-10-30 生产验证

- Worker、D1、VAPID Secret、每分钟 Cron 和正式 Pages 服务绑定已部署；线上 config 已确认 enabled:true。
- `node scripts/reminders-production-smoke.mjs` 已通过：真实后端订阅、状态读取、修改时间、安排延后测试、取消订阅、取消后状态。测试仅使用自动删除的虚拟设备，不向真实用户发送消息。
- 本地 6 项后台测试和 5 项客户端测试通过，Vite 构建、Worker dry-run 打包通过。
- 尚需用户真实 iPhone 确认收到通知；接口通过不能替代锁屏、切换应用及默认时刻的收件验收。

## 发送故障修复

用户实测未收到后，确认订阅和 Cron 正常，但发送记录连续失败。根因为 Workers 不支持 Fetch 的 `redirect: 'error'`，请求构造时直接抛出 TypeError，尚未发送到苹果。改用 `manual`，继续禁止自动跟随重定向；3xx 按发送失败处理。新增覆盖真实 sendPush 路径的回归断言，校验请求参数、加密负载和不跟随跳转。投递记录现在区分加密与传输阶段错误，避免只留下无法定位的 failed。

若依赖目录是只读共享链接、Vite 无法写入 `.vite-temp`，可使用 `node node_modules/vite/bin/vite.js build --configLoader native`，然后运行 `node scripts/prepare-sites-build.mjs`；预览使用 `node node_modules/vite/bin/vite.js preview --configLoader native`。
