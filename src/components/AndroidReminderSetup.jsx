import { useEffect, useState } from 'react'
import { androidRequest } from '../lib/android-reminders.js'
import { backgroundGuide } from '../lib/android-onboarding.js'

export default function AndroidReminderSetup({ onDone, onTimes }) {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const refresh = async () => {
    try { setStatus(await androidRequest('setupStatus')) }
    catch (error) { setMessage(error.message + '；请确认已安装 0.3.0 或更新的测试版。') }
  }
  useEffect(() => {
    refresh()
    const resume = () => { refresh() }
    window.addEventListener('kuanxin-resume', resume)
    window.addEventListener('focus', resume)
    return () => { window.removeEventListener('kuanxin-resume', resume); window.removeEventListener('focus', resume) }
  }, [])
  const act = async (action, data = {}) => {
    setBusy(true); setMessage('')
    try {
      const result = await androidRequest(action, data)
      if (action === 'test') setMessage(`预计 ${new Date(result.due).toLocaleTimeString()} 提醒。请锁屏或切到其他应用等待，不要反复点击。收到后再回来确认。`)
      if (action === 'confirmReceived') setMessage('已记录您确认收到后台测试提醒。日常提醒仍受系统设置影响。')
      await refresh()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  const guide = backgroundGuide(status?.manufacturer)
  return <>
    <h2 id="reminder-title" tabIndex={-1}>{status?.verified ? '后台测试已通过' : '让提醒按时到达'}</h2>
    <p id="reminder-description" className="reminder-description">完成设置，再锁屏试一次。</p>
    <div className="reminder-setup-steps">
      <section><span className="reminder-step-number">01</span><div><h3>允许手机提醒</h3><p>{status ? `通知${status.canNotify ? '已允许' : '未允许'} · 定时权限${status.exact ? '已允许' : '未允许'}` : '正在读取手机设置…'}</p>
        {status && !status.canNotify && <button onClick={() => act('openReminderSettings', { setting: 'notifications' })} disabled={busy}>设置通知</button>}
        {status && !status.exact && <button onClick={() => act('openReminderSettings', { setting: 'exact' })} disabled={busy}>设置定时权限</button>}
      </div></section>
      <section><span className="reminder-step-number">02</span><div><h3>允许后台提醒 · {guide.name}</h3><p>{guide.text}</p><p className="reminder-setup-note">{status?.backgroundRestricted ? '手机当前限制了后台活动，请先调整。' : '系统未报告后台限制；厂商自启动开关仍需手动核对。'}</p>
        <button onClick={() => act('openReminderSettings', { setting: 'application' })} disabled={busy}>去手机设置</button>
        <button onClick={() => act('openReminderSettings', { setting: 'battery' })} disabled={busy}>电池优化设置</button>
        <button onClick={refresh} disabled={busy}>我已设置，重新检查</button>
      </div></section>
      <section><span className="reminder-step-number">03</span><div><h3>试一次后台提醒</h3><p>请锁屏或切换应用，等待约两分钟。实际收到后，再回来点击“我已收到”。</p>
        <button onClick={() => act('test')} disabled={busy || !status?.enabled || status?.backgroundRestricted}>两分钟后测试</button>
        <button onClick={() => act('confirmReceived')} disabled={busy || !status?.enabled}>我已收到</button>
        <details><summary>没有收到？</summary><p>先核对上面的后台设置及系统通知。连续测试请间隔至少十分钟；仍未收到，可打开诊断并复制记录反馈。请勿把“立即显示测试”当作后台测试通过。</p><button onClick={() => act('diagnostics')} disabled={busy}>查看诊断记录</button></details>
      </div></section>
    </div>
    {message && <p className="reminder-message" role="status">{message}</p>}
    <button className="reminder-primary" onClick={onDone}>完成，返回首页</button>
    <button className="reminder-later" onClick={onTimes}>查看或修改提醒时间</button>
    <p className="reminder-footnote">念佛 09:00、21:00 · 一念回光 09:00、13:00、21:00 为默认时间，修改后以设置为准。</p>
  </>
}
