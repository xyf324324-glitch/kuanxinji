import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CaretRight, List, X } from '@phosphor-icons/react'
import './SiteNavigation.css'

const groups = [
  { title: '此刻', items: [['chat', '问一问', '把此刻的心事说说']] },
  { title: '慢慢读', items: [['articles', '老师文章', '从困惑，回到当下'], ['sayings', '每日一言', '留一句话，陪你今日']] },
  { title: '每日相伴', items: [['gongguoge', '功过格', '观照今日，记下一念'], ['reminders', '每日提醒', '念佛 · 一念回光']] },
  { title: '随四时探索', items: [['calendar', '节气日历', '跟着时令，照顾身心'], ['meridians', '十二经络', '从身体，读见流转'], ['classics', '经典阅读', '在古书里，慢慢相逢']] },
]

export function SiteMenuButton({ open, onClick, buttonRef }) {
  return <button ref={buttonRef} className="icon-button menu-button site-menu-trigger" type="button" onClick={onClick} aria-label={open ? '关闭导航' : '打开导航'} aria-expanded={open} aria-controls="site-menu">
    {open ? <X size={28} style={{ width: 28, height: 28 }} weight="light" /> : <List size={31} style={{ width: 31, height: 31 }} weight="light" />}
  </button>
}

export default function SiteNavigation({ open, onClose, onNavigate, savedCount = 0 }) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => panelRef.current?.querySelector('.menu-group button')?.focus({ preventScroll: true }))
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const items = [...panelRef.current.querySelectorAll('button')]
      const first = items[0], last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }) }
  }, [open])
  if (!open) return null
  return createPortal(<div className="site-navigation" role="dialog" aria-modal="true" aria-label="宽心纪导航">
    <button className="menu-scrim" type="button" onClick={onClose} aria-label="关闭导航" tabIndex={-1} />
    <nav ref={panelRef} id="site-menu" className="menu-panel" aria-label="宽心纪导航">
      <button className="menu-close" type="button" onClick={onClose} aria-label="关闭导航"><X size={27} weight="light" /></button>
      <p className="menu-kicker">宽心纪</p><h2>从此刻，慢慢走</h2>
      {groups.map((group, index) => <section className="menu-group" aria-labelledby={`menu-group-${index}`} key={group.title}>
        <p id={`menu-group-${index}`}>{group.title}</p>
        {group.items.map(([key, title, description]) => <button type="button" onClick={() => onNavigate(key)} key={key}>
          <span><strong>{title}</strong><small>{description}</small></span><CaretRight size={19} weight="light" aria-hidden="true" />
        </button>)}
      </section>)}
      <button className="menu-shelf" type="button" onClick={() => onNavigate('library')}>离线书架 <span>{savedCount} 篇已收藏</span></button>
    </nav>
  </div>, document.body)
}
