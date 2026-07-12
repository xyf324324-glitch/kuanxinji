# EdgeOne Pages 免费部署

本项目是纯静态 Vite PWA，不需要数据库、云函数或独立服务器。

## 部署参数

- Framework preset：Vite
- Install command：`npm install`
- Build command：`npm run build`
- Output directory：`dist`
- Node.js：20 或更高版本

## 首次发布

1. 把本项目放入一个 Git 仓库并推送到 GitHub。
2. 登录 EdgeOne Pages，连接该仓库。
3. 填写以上构建参数并发布。
4. 先使用平台免费网址测试，不购买域名。
5. 在微信、Safari 和 Android Chrome 中分别测试首页、文章、离线书架和更新提示。

## 更新内容

向 Git 仓库推送新的 JSON 和 `content-version.json` 后，EdgeOne 会重新构建。用户再次打开网站时会收到“发现新的内容版本”提示。

## 边界

- 免费站点适合 HTML、CSS、JS、JSON 和压缩图片。
- 不把大量 PDF、音频或视频放入项目。
- 平台账号登录和仓库授权必须由网站所有者本人完成。
