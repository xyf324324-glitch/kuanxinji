# 老师视频小人物

正式入口：src/main.jsx → src/companion-video/companion.js。素材位于 public/teacher-companion/v11/media，仅包含使用中的 11 条合成视频，未发布原始蓝底素材。

交互：点击显示换动作按钮、拖动、双指缩放、键盘操作、收起和恢复。字幕随动作显示。后台与输入/菜单场景暂停。尊重系统减少动态效果偏好。

合掌与起身后使用对应的站立过渡。静坐为 18 秒静坐加 2 秒起身准备，随后播放起身。安静站立 10 秒、阅读约 10 秒。

验证：node scripts/verify-companion.mjs；npm run build。

发布目标：https://kuanxinji.pages.dev/，沿用现有 GitHub main 分支自动部署，保留 functions。

已知限制：过渡使用图像插值，手部可能出现轻微变形；阅读缺少完整取放书过程。移动端 Safari/微信浏览器仍需真机验证。
