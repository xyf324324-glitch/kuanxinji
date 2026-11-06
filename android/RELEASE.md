# 宽心纪安卓正式版

- 应用标识：`dev.kuanxinji.app`；显示名称：宽心纪。
- 版本：1.0.0 / versionCode 10000；Android 8.0+，无 Google 推送依赖。
- 内容源固定为 `https://kuanxinji.pages.dev/`；原生桥仅注入该来源的顶层页面。
- 正式证书 SHA256：`b606170ba426079082f7af7a33a583e60ce03d78d4d88abfbdf8084d124e7a58`。

## 构建与签名

GitHub Actions `.github/workflows/android-release.yml` 构建并检查 unsigned release，私钥不上传 GitHub 或 Cloudflare。使用 `scripts/sign-android-release.ps1` 在所有者电脑上签名并核对证书。签名后不能再修改 APK。

所有者私钥保存在工作区父目录 `.tools/android-release/signing/kuanxinji-release.p12`，密码由当前 Windows 用户的 DPAPI 保护。此目录不属于源码仓库，禁止上传或提交。它不是临时 Actions 缓存。后续版本必须使用同一私钥；不要在签名文件丢失时重新生成同名密钥并宣称可覆盖更新。迁移 Windows 前必须先准备可恢复的私钥及密码备份；单独复制 DPAPI 文件不能保证跨用户或重装后恢复。

## 更新与下载

已签名的版本化 APK 与 `public/android/version.json` 一起纳入网站源码发布，后续部署保留下载文件。下载页和导航入口使用同一清单；更新时递增 versionCode 并使用新的不可变 APK 文件名，不能用旧 URL 覆盖内容。应用启动时检查清单，由用户确认下载和安装，不静默安装。

早期 `dev.kuanxinji.preview` 测试版使用独立身份，正式版不会覆盖测试版。安装正式版前关闭测试版提醒，正式版重新开启提醒即可；公开下载页也说明这一步。

## 验证边界

沿用已由用户在小米、三星、华为上验证的系统定时提醒与后台设置流程。编译、单元测试、Lint、签名和 HTTP 下载校验不能代替各品牌长期锁屏、重启与日常定时收件验收。
