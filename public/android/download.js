const byId = id => document.getElementById(id)
byId('wechat').hidden = !/MicroMessenger/i.test(navigator.userAgent)
byId('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); byId('copy').textContent = '地址已复制，请粘贴到手机浏览器' }
  catch { byId('download-status').textContent = `请复制地址栏链接：${location.href}` }
}
try {
  const response = await fetch('/android/version.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('manifest')
  const manifest = await response.json()
  byId('version').textContent = `${manifest.versionName} · Android 8.0+${manifest.sizeBytes ? ' · ' + (manifest.sizeBytes / 1048576).toFixed(2) + ' MB' : ''}`
  if (manifest.downloadReady && manifest.apkUrl) {
    const url = new URL(manifest.apkUrl, location.origin)
    if (url.origin !== location.origin || !url.pathname.startsWith('/downloads/android/') || !url.pathname.endsWith('.apk')) throw new Error('download URL')
    byId('download').href = url.href
    byId('download').hidden = false
    byId('download').download = url.pathname.split('/').pop()
    byId('download-status').textContent = '请核对应用名称“宽心纪测试版”，下载后按下方步骤安装。'
    byId('download').onclick = () => { byId('download-status').textContent = '下载后请到浏览器下载记录或文件管理找到安装包。下载并不代表已安装或已开启提醒。' }
  } else byId('download-status').textContent = '测试安装包尚未在此地址开放下载，请稍后再来。'
} catch { byId('version').textContent = '安卓安装与开启说明'; byId('download-status').textContent = '暂时无法获取安装包，请检查网络后刷新。' }
