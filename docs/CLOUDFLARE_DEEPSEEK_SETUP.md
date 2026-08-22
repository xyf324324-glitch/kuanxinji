# 宽心纪「觉」对话配置

本项目已在 `functions/api/chat.js` 中加入 Cloudflare Pages Function。它会在网站的 `/api/chat` 路径安全调用 DeepSeek，浏览器不会取得 API Key。

## Cloudflare Pages 配置

1. 打开 Cloudflare 控制台 → **Workers & Pages** → 选择 `kuanxinji` 项目。
2. 进入 **Settings → Variables and Secrets → Add**。
3. 为 **Production** 与 **Preview** 分别添加机密变量：
   - 名称：`DEEPSEEK_API_KEY`
   - 值：您在 DeepSeek 平台创建的 API Key。
4. 可选添加普通变量 `DEEPSEEK_MODEL`，值填写 `deepseek-v4-flash`；不填时程序也会默认使用该模型。
5. 确认此 Pages 项目通过 GitHub 连接部署。Cloudflare Pages 的网页后台“Direct Upload”不支持 Functions；推送到 GitHub 后，`functions/api/chat.js` 才会随项目部署。
6. 部署完成后，打开网站的“此刻有什么想问？”并发送一句测试话。浏览器开发者工具的 Network 中应能看到对 `/api/chat` 的成功请求，但绝不应看到 API Key。

## 上线前建议

- 在 Cloudflare 的安全规则中为 `/api/chat` 设置按 IP 的频率限制，避免他人滥用 DeepSeek 额度。
- 不要把 API Key 写进 `src/`、`public/`、`.env` 后提交到 GitHub，或填写在网页表单中。
- 对话仅在当前浏览器会话暂存；后端不会存储对话记录。
