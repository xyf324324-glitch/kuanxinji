import { useEffect, useRef, useState } from 'react'
import { X, Plus, CheckCircle } from '@phosphor-icons/react'
import brandCloud from '../assets/brand-cloud.png'
import { disableReminders, enableReminders, getReminderStatus, loadReminderConfig, loadReminderTimes, normalizeTimes, saveReminderTimes, updateReminderTimes, testReminder } from '../lib/reminders'
import './ReminderCard.css'

export default function ReminderCard({ isHome, settingsRequest, onClose }) {
  const [dismissed, setDismissed] = useState(false)
  const [mode, setMode] = useState('invite')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [times, setTimes] = useState(loadReminderTimes)
  const [active, setActive] = useState(null)
  const [config, setConfig] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(() => 'Notification' in window && Notification.permission === 'granted')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const dialogRef = useRef(null)
  const open = isHome && (settingsOpen || (!checkingExisting && !dismissed && !active))

  useEffect(() => {
    let ignore = false
    loadReminderConfig().then(async (next) => {
      if (ignore) return
      setConfig(next)
      try {
        const status = next ? await getReminderStatus() : null
        if (!ignore && status) { setActive(status); setTimes(status.times) }
      } catch { /* Keep the invitation until the server confirms a subscription. */ }
      finally { if (!ignore) setCheckingExisting(false) }
    })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!settingsRequest) return
    setMode('settings')
    setMessage('')
    setSettingsOpen(true)
  }, [settingsRequest])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open) { dialog?.close(); return undefined }
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    dialog.querySelector('h2')?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('reminder-visible')
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      document.documentElement.classList.remove('reminder-visible')
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open])

  const close = () => {
    if (busy) return
    setDismissed(true)
    setSettingsOpen(false)
    setMessage('')
    onClose()
  }

  const enable = async () => {
    setBusy(true)
    setMessage('')
    try {
      const status = await enableReminders(config, times)
      setActive(status)
      try { saveReminderTimes(status.times) } catch { /* The server already saved the schedule. */ }
      setMode('success')
      setSettingsOpen(true)
      setDismissed(true)
    } catch (error) {
      setMessage(error.name === 'TimeoutError' ? '连接超时，请稍后重试。' : error.message || '暂时未能开启提醒，请稍后重试。')
    } finally { setBusy(false) }
  }

  const save = async () => {
    setBusy(true)
    setMessage('')
    try {
      const next = active ? await updateReminderTimes(active.subscription, times) : normalizeTimes(times)
      if (active) setActive({ ...active, times: next })
      setTimes(next)
      try { saveReminderTimes(next) } catch {
        if (!active) throw new Error('当前浏览器无法保存设置，请允许网站存储后重试。')
      }
      setMessage(active ? '提醒时间已更新。' : '提醒时间已保存，开启提醒后生效。')
    } catch (error) { setMessage(error.message || '保存失败，请稍后重试。') }
    finally { setBusy(false) }
  }

  const disable = async () => {
    setBusy(true)
    setMessage('')
    try {
      await disableReminders(active.subscription)
      setActive(null)
      setDismissed(true)
      setMessage('每日提醒已关闭。')
    } catch (error) { setMessage(error.message || '暂时未能关闭提醒，请稍后重试。') }
    finally { setBusy(false) }
  }

  const changeTime = (key, index, value) => {
    setMessage('')
    setTimes((current) => ({ ...current, [key]: current[key].map((time, i) => i === index ? value : time) }))
  }

  const test = async () => {
    setBusy(true)
    try {
      await testReminder(active.subscription)
      setMessage('测试通知已安排，将在约两分钟内发送。可以锁屏或切到其他应用等待。')
    } catch { setMessage('暂时未能安排测试通知，请一分钟后重试。') }
    finally { setBusy(false) }
  }

  return (
    <dialog ref={dialogRef} className={`reminder-card reminder-card--${mode}`} aria-labelledby="reminder-title" aria-describedby="reminder-description" onCancel={(event) => { event.preventDefault(); close() }}>
      <button className="reminder-close" type="button" aria-label="关闭每日提醒邀请" onClick={close} disabled={busy}><X size={23} weight="light" /></button>
      <div className="reminder-brand"><img src={brandCloud} alt="" /><span>宽心纪</span></div>
      {mode === 'invite' && <>
        <h2 id="reminder-title" tabIndex={-1}>宽心每日提醒</h2>
        <p id="reminder-description" className="reminder-description">开启后，手机会定时提醒您</p>
        <p className="reminder-practices"><span>念佛</span><span className="reminder-divider" aria-hidden="true" /><span>一念回光</span></p>
        <button className="reminder-primary" type="button" onClick={enable} disabled={busy}>{busy ? '正在开启…' : '开启每日提醒'}</button>
        <button className="reminder-later" type="button" onClick={close} disabled={busy}>暂不开启</button>
        <p className="reminder-footnote">开启后，可在导航中调整时间或关闭。</p>
      </>}
      {mode === 'success' && <>
        <CheckCircle className="reminder-success-icon" size={36} weight="light" aria-hidden="true" />
        <h2 id="reminder-title" tabIndex={-1}>已开启宽心提醒</h2>
        <p id="reminder-description" className="reminder-description">愿每一次提醒，都能陪您安住当下。</p>
        <button className="reminder-primary" type="button" onClick={close}>好的</button>
        <button className="reminder-later" type="button" onClick={() => { setMode('settings'); setMessage('') }}>调整提醒时间</button>
        {active && <button className="reminder-later" type="button" onClick={test} disabled={busy}>发送测试通知</button>}
      </>}
      {mode === 'settings' && <>
        <h2 id="reminder-title" tabIndex={-1}>每日提醒设置</h2>
        <p id="reminder-description" className="reminder-description">按手机当地时间提醒，随时可以调整。</p>
        <div className="reminder-schedules">
          {[['nianfo', '念佛'], ['huiguang', '一念回光']].map(([key, label]) => <fieldset key={key} disabled={busy}>
            <legend>{label}</legend>
            <div className="reminder-times">{times[key].map((time, index) => <div className="reminder-time" key={`${key}-${index}`}>
              <input type="time" value={time} required aria-label={`${label}第${index + 1}次提醒时间`} onInput={(event) => changeTime(key, index, event.currentTarget.value)} onChange={(event) => changeTime(key, index, event.target.value)} />
              {times[key].length > 1 && <button type="button" aria-label={`删除${label}第${index + 1}次提醒`} onClick={() => { setMessage(''); setTimes((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) })) }}><X size={15} /></button>}
            </div>)}</div>
            {times[key].length < 5 && <button className="reminder-add" type="button" onClick={() => { setMessage(''); setTimes((current) => ({ ...current, [key]: [...current[key], '12:00'] })) }}><Plus size={14} />添加时间</button>}
          </fieldset>)}
        </div>
        <button className="reminder-primary" type="button" onClick={save} disabled={busy || Object.values(times).some((items) => items.some((time) => !time))}>{busy ? '正在处理…' : '保存提醒时间'}</button>
        <button className="reminder-later" type="button" onClick={active ? disable : enable} disabled={busy}>{active ? '关闭每日提醒' : '开启每日提醒'}</button>
        {active && <button className="reminder-later" type="button" onClick={test} disabled={busy}>发送测试通知</button>}
      </>}
      {message && <p className="reminder-message" role="status">{message}</p>}
    </dialog>
  )
}
