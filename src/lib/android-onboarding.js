export function needsAndroidDownload(userAgent = navigator.userAgent, native = false) {
  return !native && /Android/i.test(userAgent)
}

export function backgroundGuide(manufacturer = '') {
  const maker = manufacturer.toLowerCase()
  if (/xiaomi|redmi|poco/.test(maker)) return { name: '小米', text: '允许后台自启动，并将应用省电设为“无限制”。' }
  if (/samsung/.test(maker)) return { name: '三星', text: '电池设为“不受限制”，将宽心纪移出休眠、深度休眠应用。' }
  if (/huawei|honor/.test(maker)) return { name: '华为 / 荣耀', text: '在应用启动管理中改为手动，允许自启动、关联启动和后台活动。' }
  return { name: '您的手机', text: '在应用的电池或启动管理中允许后台活动，并核对自启动设置。' }
}
