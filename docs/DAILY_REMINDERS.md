# 宽心每日提醒

本次完成的是已确认的玻璃邀请卡、导航设置和推送客户端接入层；**当前仓库没有推送服务、订阅数据库、VAPID 配置及定时发送任务，因此尚不能向手机实际定时发送通知。** 不要把授予通知权限或保存本地时间视为订阅成功。

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

后端需校验订阅凭据并按设备隔离，不应仅凭可猜标识修改别人的设置；校验时区、时间与条数，限制请求与发送频率。数据库与 VAPID 私钥必须存放在服务端。发送任务应幂等、合并同刻内容，并清理返回 404 / 410 的失效订阅。当前只定义接口，不包含这些服务器实现。

PWA 的 `public/reminder-push.js` 已接入生成的 worker。推送内容支持 `{ "kind": "nianfo" }`、`{ "kind": "huiguang" }`，缺省为合并提醒。通知点击回首页，标题、正文使用固定站内文案。

单文件构建不包含 PWA，因此不会把它当作可成功订阅的安装包。

## 本地检查

```text
node --test scripts/reminders.test.mjs
npm run lint
npm run build
```

若依赖目录是只读共享链接、Vite 无法写入 `.vite-temp`，可使用 `node node_modules/vite/bin/vite.js build --configLoader native`，然后运行 `node scripts/prepare-sites-build.mjs`；预览使用 `node node_modules/vite/bin/vite.js preview --configLoader native`。
