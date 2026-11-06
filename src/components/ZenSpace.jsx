import { useEffect, useRef, useState } from 'react'
import './ZenSpace.css'

// The frame is mounted once: article navigation never recreates the audio player.
export default function ZenSpace({ children }) {
  const frame = useRef(null)
  const [open, setOpen] = useState(() => location.hash === '#/zen')
  const [journalOpen, setJournalOpen] = useState(() => location.hash === '#/gongguoge')
  const [menuOpen, setMenuOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const send = (command, extra = {}) => frame.current?.contentWindow?.postMessage({ type: 'zen-command', command, ...extra }, location.origin)

  useEffect(() => {
    const route = () => { setOpen(location.hash === '#/zen'); setJournalOpen(location.hash === '#/gongguoge'); setMenuOpen(false) }
    const menu = e => setMenuOpen(Boolean(e.detail))
    const message = e => {
      if (e.origin === location.origin && e.source === document.querySelector('.zen-journal-panel iframe')?.contentWindow) {
        if(e.data?.type === 'journal-menu-state') { setMenuOpen(Boolean(e.data.open)); return }
        if(e.data?.type === 'journal-navigate' && ['chat','articles','sayings','reminders','zen','calendar','meridians','classics','library'].includes(e.data.destination)){location.hash='/'+e.data.destination;return}
      }
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return
      if (e.data?.type === 'zen-state') setPlaying(Boolean(e.data.playing))
      if (e.data?.type === 'zen-close') location.hash = '/'
    }
    // Playback retries only on a real gesture; explicit off preferences stay off.
    const gesture = e => { if (!e.target.closest('.site-music-toggle')) send('unlock') }
    window.addEventListener('hashchange', route)
    window.addEventListener('zen-menu', menu)
    window.addEventListener('message', message)
    document.addEventListener('pointerdown', gesture, { once: true })
    return () => {
      window.removeEventListener('hashchange', route)
      window.removeEventListener('zen-menu', menu)
      window.removeEventListener('message', message)
      document.removeEventListener('pointerdown', gesture)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    send('visible', { visible: open })
    document.body.classList.toggle('zen-space-open', open || journalOpen)
    if (open) frame.current?.focus()
    return () => document.body.classList.remove('zen-space-open')
  }, [open, journalOpen, ready])

  return <>
    <audio id="zen-native-audio" preload="none" />
    <div inert={open || journalOpen ? true : undefined} aria-hidden={open || journalOpen || undefined}>{children}</div>
    {journalOpen && <section className="zen-journal-panel" aria-label="功过格">
      <iframe src="/gongguoge/" title="功过格" />
      <button type="button" className="zen-journal-back" onClick={() => { location.hash = '/' }}>返回首页</button>
    </section>}
    <iframe ref={frame} className={`zen-space-frame${open ? ' is-open' : ''}`}
      src="/zen/index.html?embedded=1" title="禅意空间" tabIndex={open ? 0 : -1}
      aria-hidden={!open} allow="autoplay" onLoad={() => { setReady(true); send('state') }} />
    {!open && !menuOpen && <button className="site-music-toggle" type="button"
      aria-label={playing ? '关闭音乐' : '开启音乐'} aria-pressed={playing}
      title={playing ? '关闭音乐' : '开启音乐'} onClick={() => send('toggle')}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {playing ? <><path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></> : <><path d="M9 12V5l11-2v9M9 8l7-1.3M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2c.6 0 1.2.1 1.7.3M20 16c0 1.1-1.3 2-3 2-.6 0-1.2-.1-1.7-.3"/><path d="m3 3 18 18"/></>}
      </svg>
    </button>}
  </>
}
