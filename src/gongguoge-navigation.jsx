import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SiteNavigation, { SiteMenuButton } from './components/SiteNavigation'
import { listSavedArticles } from './lib/library'

export default function JournalNavigation() {
  const [open, setOpen] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const buttonRef = useRef(null)
  useEffect(() => { listSavedArticles().then(items => setSavedCount(items.length)) }, [])
  const close = () => setOpen(false)
  const navigate = (key) => {
    close()
    if (key === 'gongguoge') return
    window.location.assign(`/#/${key}`)
  }
  return <><SiteMenuButton open={open} onClick={() => setOpen(current => !current)} buttonRef={buttonRef} />
    <SiteNavigation open={open} onClose={close} onNavigate={navigate} savedCount={savedCount} /></>
}

createRoot(document.getElementById('journal-navigation')).render(<JournalNavigation />)
