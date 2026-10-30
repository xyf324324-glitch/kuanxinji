export const defaults = { nianfo: ['09:00', '21:00'], huiguang: ['09:00', '13:00', '21:00'] }
export function validateSchedule(times, zone) {
  new Intl.DateTimeFormat('en', { timeZone: zone }).format()
  if (typeof zone !== 'string' || zone.length > 80) throw new Error('Invalid timezone')
  const result = {}
  for (const key of Object.keys(defaults)) {
    const list = times?.[key]
    if (!Array.isArray(list) || !list.length || list.length > 5 || list.some(t => typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new Error('Invalid times')
    result[key] = [...new Set(list)].sort()
  }
  return result
}
export function localTime(epoch, zone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(epoch)
  return `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}`
}
// Scan actual UTC minutes: skips nonexistent DST times; repeated times use actual occurrences.
export function nextDue(times, zone, after) {
  const wanted = new Set(Object.values(times).flat())
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  for (let t = Math.floor(after / 60000) * 60000 + 60000, end = after + 49 * 3600000; t <= end; t += 60000) {
    if (wanted.has(formatter.format(t))) return t
  }
  throw new Error('No next reminder')
}
export function kindAt(times, zone, due) {
  const time = localTime(due, zone)
  const n = times.nianfo.includes(time), h = times.huiguang.includes(time)
  return n && h ? 'both' : n ? 'nianfo' : 'huiguang'
}
