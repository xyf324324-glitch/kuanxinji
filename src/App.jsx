import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowClockwise,
  ArrowRight,
  BookmarkSimple,
  BookOpenText,
  Books,
  CaretRight,
  CheckCircle,
  Copy,
  MagnifyingGlass,
  ShareNetwork,
  WifiSlash,
  X,
} from '@phosphor-icons/react'
import mistLake from './assets/mist-lake-lotus.jpg'
import kuanxinLogo from './assets/kuanxin-logo-transparent.png'
import brandCloud from './assets/brand-cloud.png'
import { articles, loadArticle } from './content'
import contentVersion from './content/content-version.json'
import HomeScreen from './components/HomeScreen'
import ReadingScreen from './components/ReadingScreen'
import PracticeScreen from './components/PracticeScreen'
import {
  listSavedArticles,
  loadReadingProgress,
  removeSavedArticle,
  saveArticle,
  saveReadingProgress,
} from './lib/library'
import { usePwaStatus } from './hooks/usePwaStatus'
import './index.css'

const SolarTermCalendar = lazy(() => import('./components/SolarTermCalendar'))
const SolarTermWellness = lazy(() => import('./components/SolarTermWellness'))
const MeridianAtlas = lazy(() => import('./components/MeridianAtlas'))
const ClassicsReader = lazy(() => import('./components/ClassicsReader'))
const SayingsCard = lazy(() => import('./components/SayingsCard'))
const ProfileScreen = lazy(() => import('./components/ProfileScreen'))

function drawWrappedText(context, text, centerX, startY, maxWidth, lineHeight) {
  const characters = Array.from(text)
  const lines = []
  let line = ''

  characters.forEach((character) => {
    const next = `${line}${character}`
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = character
    } else {
      line = next
    }
  })
  if (line) lines.push(line)
  lines.forEach((content, index) => context.fillText(content, centerX, startY + index * lineHeight))
  return startY + lines.length * lineHeight
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

function App() {
  const [view, setView] = useState('home')
  const [article, setArticle] = useState(articles[0])
  const [articleOrigin, setArticleOrigin] = useState('result')
  const [shared, setShared] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedArticleEntries, setSavedArticleEntries] = useState([])
  const [libraryUndo, setLibraryUndo] = useState(null)
  const [readingProgress, setReadingProgress] = useState({})
  const [articleQuery, setArticleQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState('全部')
  const [visibleArticleCount, setVisibleArticleCount] = useState(20)
  const [wellnessTerm, setWellnessTerm] = useState('xiaoshu')
  const [meridianId, setMeridianId] = useState('lung')
  const [classicId, setClassicId] = useState('daily-rhythm')
  const [sayingsOrigin, setSayingsOrigin] = useState('content')
  const {
    isOnline,
    offlineReady,
    updateAvailable,
    targetVersion,
    isApplyingUpdate,
    dismissOfflineReady,
    dismissUpdate,
    applyUpdate,
  } = usePwaStatus()

  useEffect(() => {
    Promise.all([listSavedArticles(), loadReadingProgress()]).then(([savedEntries, progressEntries]) => {
      setSavedArticleEntries(savedEntries)
      setReadingProgress(progressEntries)
    })
  }, [])

  useEffect(() => {
    const syncRoute = async () => {
      const rawRoute = window.location.hash.replace(/^#/, '') || '/'
      const [path, query = ''] = rawRoute.split('?')
      const [, section, id] = path.split('/')
      const matchedArticle = articles.find((item) => item.id === id)

      if (section === 'article' && matchedArticle) {
        setArticle(await loadArticle(matchedArticle.id))
        const origin = new URLSearchParams(query).get('from')
        setArticleOrigin(['content', 'library', 'articles'].includes(origin) ? origin : 'result')
        setView('article')
      } else if (section === 'answer' && matchedArticle) {
        setArticle(matchedArticle)
        setView('result')
      } else if (section === 'library') {
        setView('library')
      } else if (section === 'profile') {
        setView('profile')
      } else if (section === 'content') {
        setView('content')
      } else if (section === 'practice') {
        setView('practice')
      } else if (section === 'articles') {
        setView('articles')
      } else if (section === 'calendar') {
        setView('calendar')
      } else if (section === 'wellness' && id) {
        setWellnessTerm(decodeURIComponent(id))
        setView('wellness')
      } else if (section === 'meridians') {
        setMeridianId(id || 'lung')
        setView('meridians')
      } else if (section === 'classics') {
        setClassicId(id || 'daily-rhythm')
        setView('classics')
      } else if (section === 'sayings') {
        setView('sayings')
      } else if (section === 'breathing') {
        setView('breathing')
      } else {
        setView('home')
      }
    }

    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    const titles = {
      home: '宽心纪｜愿您宽心',
      breathing: '片刻安住｜宽心纪',
      result: `${article.title}｜宽心纪`,
      content: '内容导航｜宽心纪',
      practice: '每日功课｜宽心纪',
      articles: '老师文章库｜宽心纪',
      calendar: '二十四节气｜宽心纪',
      wellness: '四时养生｜宽心纪',
      meridians: '十二经络｜宽心纪',
      classics: '内经小笺｜宽心纪',
      sayings: '上师一言｜宽心纪',
      article: `${article.title}｜宽心纪`,
      library: '离线书架｜宽心纪',
      profile: '我的记录｜宽心纪',
    }
    document.title = titles[view] || '宽心纪｜愿您宽心'

    const focusFrame = window.requestAnimationFrame(() => {
      document.querySelector(`[data-view="${view}"] [data-route-heading]`)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(focusFrame)
  }, [view, article.id, article.title])

  useEffect(() => {
    if (view !== 'breathing') return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => {
      const selected = articles[Math.floor(Math.random() * articles.length)]
      setArticle(selected)
      setView('result')
      window.location.hash = `/answer/${selected.id}`
    }, reducedMotion ? 500 : 4200)
    return () => window.clearTimeout(timer)
  }, [view])

  useEffect(() => {
    if (view !== 'article') return undefined
    window.scrollTo({ top: 0, behavior: 'instant' })
    let progressFrame
    let saveTimer
    let latestProgress = 0

    const persistProgress = () => {
      setReadingProgress((current) => current[article.id] === latestProgress
        ? current
        : { ...current, [article.id]: latestProgress })
      saveReadingProgress(article.id, latestProgress)
    }

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
      const normalized = Math.max(0, Math.min(100, Math.round(progress)))
      latestProgress = normalized
      document.querySelector('.reading-progress')?.style.setProperty('--reading-progress', String(normalized / 100))
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(persistProgress, 250)
    }

    const scheduleProgressUpdate = () => {
      if (progressFrame) return
      progressFrame = window.requestAnimationFrame(() => {
        progressFrame = undefined
        updateProgress()
      })
    }

    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    updateProgress()
    return () => {
      window.removeEventListener('scroll', scheduleProgressUpdate)
      if (progressFrame) window.cancelAnimationFrame(progressFrame)
      window.clearTimeout(saveTimer)
      persistProgress()
    }
  }, [view, article.id])

  const savedArticleIds = useMemo(() => savedArticleEntries.map((entry) => entry.id), [savedArticleEntries])
  const savedArticles = useMemo(() => [...savedArticleEntries]
    .sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0))
    .map((entry) => articles.find((item) => item.id === entry.id))
    .filter(Boolean), [savedArticleEntries])
  const articleIsSaved = savedArticleIds.includes(article.id)
  const relatedArticles = useMemo(() => {
    const themes = new Set(article.themes || [])
    const keywords = new Set(article.keywords || [])
    const concerns = new Set(article.userConcerns || [])

    return articles
      .filter((item) => item.id !== article.id)
      .map((item) => ({
        item,
        score: item.themes.filter((theme) => themes.has(theme)).length * 5
          + item.keywords.filter((keyword) => keywords.has(keyword)).length * 3
          + item.userConcerns.filter((concern) => concerns.has(concern)).length * 2,
      }))
      .sort((a, b) => b.score - a.score || a.item.order - b.item.order)
      .slice(0, 3)
      .map(({ item }) => item)
  }, [article.id, article.keywords, article.themes, article.userConcerns])
  const articleThemes = ['全部', ...new Set(articles.flatMap((item) => item.themes))]
  const filteredArticles = useMemo(() => {
    const query = articleQuery.trim().toLowerCase()
    return articles.filter((item) => {
      const matchesTheme = activeTheme === '全部' || item.themes.includes(activeTheme)
      const searchable = [item.title, item.quote, ...item.keywords, ...item.userConcerns].join(' ').toLowerCase()
      return matchesTheme && (!query || searchable.includes(query))
    })
  }, [activeTheme, articleQuery])

  useEffect(() => setVisibleArticleCount(20), [activeTheme, articleQuery])

  useEffect(() => {
    if (!libraryUndo) return undefined
    const timer = window.setTimeout(() => setLibraryUndo(null), 10000)
    return () => window.clearTimeout(timer)
  }, [libraryUndo])

  const begin = () => {
    setView('breathing')
    window.location.hash = '/breathing'
  }

  const openArticle = async (nextArticle = article, origin = view) => {
    const normalizedOrigin = ['content', 'library', 'articles'].includes(origin) ? origin : 'result'
    const fullArticle = nextArticle.paragraphs ? nextArticle : await loadArticle(nextArticle.id)
    setArticle(fullArticle)
    setArticleOrigin(normalizedOrigin)
    setView('article')
    window.location.hash = `/article/${fullArticle.id}?from=${normalizedOrigin}`
  }

  const goHome = () => {
    setView('home')
    window.location.hash = '/'
  }

  const returnFromArticle = () => {
    setView(articleOrigin)
    const returnRoute = articleOrigin === 'content'
      ? '/content'
      : articleOrigin === 'library'
        ? '/library'
        : articleOrigin === 'articles'
          ? '/articles'
        : `/answer/${article.id}`
    window.location.hash = returnRoute
  }

  const openLibrary = () => {
    setView('library')
    window.location.hash = '/library'
  }

  const openProfile = () => {
    setView('profile')
    window.location.hash = '/profile'
  }

  const openContent = () => {
    setView('content')
    window.location.hash = '/content'
  }

  const openPractice = () => {
    setView('practice')
    window.location.hash = '/practice'
  }

  const openArticles = () => {
    setView('articles')
    window.location.hash = '/articles'
  }

  const openCalendar = () => {
    setView('calendar')
    window.location.hash = '/calendar'
  }

  const openWellness = (term) => {
    setWellnessTerm(term)
    setView('wellness')
    window.location.hash = `/wellness/${encodeURIComponent(term)}`
  }

  const returnFromWellness = () => {
    setView('calendar')
    window.location.hash = '/calendar'
  }

  const openMeridians = (id = 'lung') => {
    setMeridianId(id)
    setView('meridians')
    window.location.hash = `/meridians/${id}`
  }

  const returnFromMeridians = () => {
    setView('content')
    window.location.hash = '/content'
  }

  const openClassics = (id = 'daily-rhythm') => {
    setClassicId(id)
    setView('classics')
    window.location.hash = `/classics/${id}`
  }

  const returnFromClassics = () => {
    setView('content')
    window.location.hash = '/content'
  }

  const openSayings = (origin = view) => {
    setSayingsOrigin(typeof origin === 'string' ? origin : view)
    setView('sayings')
    window.location.hash = '/sayings'
  }

  const returnFromSayings = () => {
    if (sayingsOrigin === 'home') {
      goHome()
      return
    }
    setView('content')
    window.location.hash = '/content'
  }

  const toggleSavedArticle = async (targetArticle = article) => {
    const isSaved = savedArticleIds.includes(targetArticle.id)
    if (isSaved) {
      await removeSavedArticle(targetArticle.id)
      setSavedArticleEntries((current) => current.filter((entry) => entry.id !== targetArticle.id))
    } else {
      const entry = await saveArticle(targetArticle)
      setSavedArticleEntries((current) => [entry, ...current.filter((item) => item.id !== targetArticle.id)])
    }
  }

  const removeFromLibrary = async (targetArticle) => {
    const entry = savedArticleEntries.find((item) => item.id === targetArticle.id) || {
      id: targetArticle.id,
      savedAt: new Date().toISOString(),
    }
    await removeSavedArticle(targetArticle.id)
    setSavedArticleEntries((current) => current.filter((item) => item.id !== targetArticle.id))
    setLibraryUndo({ article: targetArticle, entry })
  }

  const undoLibraryRemoval = async () => {
    if (!libraryUndo) return
    const restoredEntry = await saveArticle(libraryUndo.article, libraryUndo.entry.savedAt)
    setSavedArticleEntries((current) => [restoredEntry, ...current.filter((item) => item.id !== restoredEntry.id)])
    setLibraryUndo(null)
  }

  const openOriginalArticle = () => {
    if (!article.sourceUrl) return
    window.open(article.sourceUrl, '_blank', 'noopener,noreferrer')
  }

  const saveQuoteCard = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1440
    const context = canvas.getContext('2d')
    if (!context) return

    context.fillStyle = '#f8f5ef'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#b77932'
    context.lineWidth = 2
    context.strokeRect(68, 68, 944, 1304)

    context.textAlign = 'center'
    context.fillStyle = '#b06f2a'
    context.font = '32px "Songti SC", serif'
    context.fillText(article.theme, 540, 250)

    context.fillStyle = '#272522'
    context.font = '58px "Songti SC", serif'
    const quoteEnd = drawWrappedText(context, `“${article.quote}”`, 540, 480, 780, 92)

    context.fillStyle = '#70685d'
    context.font = '30px "Songti SC", serif'
    drawWrappedText(context, article.title, 540, quoteEnd + 84, 760, 50)

    context.fillStyle = '#b77932'
    context.fillRect(470, 1110, 140, 2)
    try {
      const logo = await loadImage(kuanxinLogo)
      context.drawImage(logo, 360, 1030, 360, 360)
    } catch {
      context.fillStyle = '#2b2926'
      context.font = '42px "Songti SC", serif'
      context.fillText('宽心纪', 540, 1215)
    }
    context.fillStyle = '#777066'
    context.font = '24px "Songti SC", serif'
    context.fillText('愿您宽心', 540, 1324)

    const link = document.createElement('a')
    link.download = `宽心纪-${article.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setSaved(true)
  }

  const shareQuote = async () => {
    const payload = {
      title: '宽心纪｜愿您宽心',
      text: `“${article.quote}”\n——${article.title}`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`)
      }
      setShared(true)
    } catch (error) {
      if (error?.name !== 'AbortError') setShared(false)
    }
  }

  return (
    <div className="stage">
      <main className="mobile-prototype" aria-label="宽心纪">
        {view === 'home' && (
          <HomeScreen
            onOpenAnswer={begin}
            onOpenReading={openContent}
            onOpenPractice={openPractice}
            onOpenSayings={() => openSayings('home')}
            onOpenProfile={openProfile}
          />
        )}

        {view === 'breathing' && (
          <section className="ritual-screen" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="ritual-header">
              <button className="back-button" type="button" onClick={goHome}><ArrowLeft size={18} /> 返回</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="breathing-content" aria-live="polite">
              <p>请安静片刻</p>
              <div className="breathing-ring" aria-label="正在为你翻阅答案之书">
                <img src={brandCloud} alt="" />
              </div>
              <span>让念头慢慢落下</span>
              <small>答案正在一页一页靠近</small>
            </div>
          </section>
        )}

        {view === 'result' && (
          <section className="result-screen" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="result-header">
              <button className="back-button" type="button" onClick={goHome}><ArrowLeft size={18} /> 首页</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="result-kicker"><img src={brandCloud} alt="" /><span>此刻的答案</span></div>
            <article className="quote-sheet">
              <p className="article-theme">{article.theme}</p>
              <blockquote>“{article.quote}”</blockquote>
              <p className="article-title">{article.title}</p>
              <button className="read-button" type="button" onClick={() => openArticle(article)}>读完整篇 <ArrowRight size={17} /></button>
            </article>
            <div className="result-actions">
              <button type="button" onClick={saveQuoteCard}><Copy size={17} /> {saved ? '已保存图片' : '保存图片'}</button>
              <button type="button" onClick={shareQuote}><ShareNetwork size={17} /> {shared ? '已准备分享' : '分享引文'}</button>
            </div>
            <p className="result-caution">若心里仍很乱，不妨先读完这一篇，让答案慢慢落下。</p>
            <p className="result-signature">宽心纪 · 愿您宽心</p>
          </section>
        )}

        {view === 'content' && (
          <ReadingScreen
            articles={articles}
            onOpenHome={goHome}
            onOpenArticles={openArticles}
            onOpenArticle={(item) => openArticle(item, 'content')}
            onOpenSayings={() => openSayings('content')}
            onOpenCalendar={openCalendar}
            onOpenMeridians={() => openMeridians()}
            onOpenClassics={() => openClassics()}
            onOpenPractice={openPractice}
            onOpenProfile={openProfile}
          />
        )}

        {view === 'practice' && (
          <PracticeScreen
            onOpenHome={goHome}
            onOpenReading={openContent}
            onOpenProfile={openProfile}
          />
        )}

        {view === 'profile' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在打开本地记录…</div>}>
            <ProfileScreen
              onOpenHome={goHome}
              onOpenReading={openContent}
              onOpenPractice={openPractice}
              onOpenLibrary={openLibrary}
              contentVersion={contentVersion.version}
              savedCount={savedArticles.length}
            />
          </Suspense>
        )}

        {view === 'articles' && (
          <section className="articles-screen" data-view="articles">
            <header className="article-header">
              <button className="back-button" type="button" onClick={openContent}><ArrowLeft size={18} /> 内容</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="articles-intro">
              <div><img src={brandCloud} alt="" /><span>老师文章</span></div>
              <h1 data-route-heading tabIndex="-1">此刻，想读些什么？</h1>
              <p>可以按主题慢慢翻，也可以写下一个词。搜索只在这台设备上进行。</p>
              <label className="article-search">
                <MagnifyingGlass size={18} />
                <input value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} placeholder="搜索标题、主题或困惑" aria-label="搜索文章标题、主题或困惑" />
                {articleQuery && <button type="button" onClick={() => setArticleQuery('')} aria-label="清除搜索"><X size={16} /></button>}
              </label>
              <div className="theme-filters" aria-label="文章主题筛选">
                {articleThemes.map((theme) => (
                  <button className={theme === activeTheme ? 'active' : ''} key={theme} type="button" aria-pressed={theme === activeTheme} onClick={() => setActiveTheme(theme)}>{theme}</button>
                ))}
              </div>
            </div>
            <p className="catalog-status" role="status" aria-live="polite">
              找到 {filteredArticles.length} 篇{filteredArticles.length > 0 ? `，当前显示 ${Math.min(visibleArticleCount, filteredArticles.length)} 篇` : ''}
            </p>
            <div className="article-catalog" key={`${activeTheme}-${articleQuery}`}>
              {filteredArticles.length > 0 ? filteredArticles.slice(0, visibleArticleCount).map((item) => (
                <article key={item.id}>
                  <button className="catalog-open" type="button" onClick={() => openArticle(item, 'articles')}>
                    <span>{item.theme}</span>
                    <h2>{item.title}</h2>
                    <p>{item.quote}</p>
                    <small>{readingProgress[item.id] ? `上次读到 ${readingProgress[item.id]}%` : '开始阅读'}</small>
                    <CaretRight size={18} />
                  </button>
                  <button className="catalog-save" type="button" onClick={() => toggleSavedArticle(item)} aria-pressed={savedArticleIds.includes(item.id)} aria-label={savedArticleIds.includes(item.id) ? `从离线书架移除《${item.title}》` : `离线保存《${item.title}》`}>
                    <BookmarkSimple size={18} weight={savedArticleIds.includes(item.id) ? 'fill' : 'regular'} />
                  </button>
                </article>
              )) : (
                <div className="catalog-empty"><MagnifyingGlass size={28} /><strong>暂时没有找到</strong><p>换一个词，或者回到“全部”主题再看看。</p></div>
              )}
            </div>
            {visibleArticleCount < filteredArticles.length && (
              <button className="catalog-more" type="button" onClick={() => setVisibleArticleCount((count) => count + 20)}>
                再读二十篇 <ArrowRight size={15} />
              </button>
            )}
            <p className="catalog-count">当前收录 {articles.length} 篇 · 内容版本 {contentVersion.version}</p>
          </section>
        )}

        {view === 'calendar' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在翻开四时日历…</div>}>
            <SolarTermCalendar onBack={openContent} onOpenWellness={openWellness} />
          </Suspense>
        )}

        {view === 'wellness' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在展开四时养生…</div>}>
            <SolarTermWellness term={wellnessTerm} onBack={returnFromWellness} onNavigate={openWellness} onOpenMeridians={() => openMeridians()} />
          </Suspense>
        )}

        {view === 'meridians' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在展开经络图志…</div>}>
            <MeridianAtlas meridianId={meridianId} onBack={returnFromMeridians} onNavigate={openMeridians} onOpenClassics={() => openClassics()} />
          </Suspense>
        )}

        {view === 'classics' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在翻开内经小笺…</div>}>
            <ClassicsReader
              classicId={classicId}
              onBack={returnFromClassics}
              onNavigate={openClassics}
              onOpenCalendar={openCalendar}
              onOpenMeridians={() => openMeridians()}
            />
          </Suspense>
        )}

        {view === 'sayings' && (
          <Suspense fallback={<div className="calendar-loading" role="status">正在展开今日一言…</div>}>
            <SayingsCard onBack={returnFromSayings} backLabel={sayingsOrigin === 'home' ? '首页' : '内容'} />
          </Suspense>
        )}

        {view === 'article' && (
          <section className="article-screen" data-view="article">
            <header className="article-header">
              <button className="back-button" type="button" onClick={returnFromArticle}><ArrowLeft size={18} /> 返回</button>
              <img src={kuanxinLogo} alt="宽心纪" />
              <span className="reading-progress" style={{ '--reading-progress': (readingProgress[article.id] || 0) / 100 }} aria-hidden="true" />
            </header>
            <article className="article-body">
              <div className="article-kicker"><img src={brandCloud} alt="" /><span>宽心阅读</span></div>
              <p className="article-theme">{article.theme}</p>
              <h1 className={article.title.length > 45 ? 'long-title' : ''} data-route-heading tabIndex="-1">{article.title}</h1>
              <div className="article-rule" />
              {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p className="article-signature">{article.sourceStatus === 'published-source' ? '— 赖宽心 · 整理自公众号原文' : '— 原型示例 · 上线前替换为经审核的授权原文'}</p>
              <section className="article-related" aria-label="继续阅读">
                <h2>读完这一篇，再看看</h2>
                {relatedArticles.map((item) => (
                  <button key={item.id} type="button" onClick={() => openArticle(item, articleOrigin)}>
                    <span>{item.theme}</span><strong>{item.title}</strong><CaretRight size={16} />
                  </button>
                ))}
              </section>
            </article>
            <footer className="article-footer">
              <button type="button" onClick={() => toggleSavedArticle(article)}>
                <BookmarkSimple size={18} weight={articleIsSaved ? 'fill' : 'regular'} /> {articleIsSaved ? '已存离线' : '离线保存'}
              </button>
              <button type="button" onClick={shareQuote}><ShareNetwork size={18} /> {shared ? '已准备分享' : '分享文章'}</button>
              <button type="button" onClick={openOriginalArticle} disabled={!article.sourceUrl}><BookOpenText size={18} /> {article.sourceUrl ? '公众号原文' : '原文待核对'}</button>
            </footer>
          </section>
        )}

        {view === 'library' && (
          <section className="library-screen" data-view="library" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="result-header">
              <button className="back-button" type="button" onClick={openProfile}><ArrowLeft size={18} /> 我的</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="library-heading">
              <img src={brandCloud} alt="" />
              <p>离线书架</p>
              <h1 data-route-heading tabIndex="-1">留在这台手机里的文字</h1>
              <span>收藏和阅读进度只保存在当前设备，不会上传。</span>
            </div>
            {savedArticles.length > 0 ? (
              <div className="library-list">
                {savedArticles.map((item) => (
                  <article key={item.id}>
                    <button className="library-open" type="button" onClick={() => openArticle(item, 'library')}>
                      <small>{item.theme}</small>
                      <strong>{item.title}</strong>
                      <span>{readingProgress[item.id] ? `已读 ${readingProgress[item.id]}%` : '尚未开始阅读'}</span>
                      <CaretRight size={18} />
                    </button>
                    <button className="library-remove" type="button" onClick={() => removeFromLibrary(item)} aria-label={`从离线书架移除《${item.title}》`}>移出书架</button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="library-empty">
                <Books size={34} weight="light" />
                <strong>书架还是空的</strong>
                <p>读文章时点击“离线保存”，它就会留在这里。</p>
                <button type="button" onClick={openArticles}>去文章库看看</button>
              </div>
            )}
            <p className="library-version">本地内容版本 {contentVersion.version}</p>
            {libraryUndo && (
              <div className="library-undo" role="status">
                <span>已移出《{libraryUndo.article.title}》</span>
                <button type="button" onClick={undoLibraryRemoval}>撤销</button>
              </div>
            )}
          </section>
        )}

        {!isOnline && (
          <div className="network-status" role="status"><WifiSlash size={16} /> 当前处于离线状态，已保存内容仍可阅读</div>
        )}

        {offlineReady && (
          <aside className="pwa-notice" role="status">
            <CheckCircle size={20} weight="fill" />
            <div><strong>离线阅读已经准备好</strong><span>下次没有网络，也能打开宽心纪。</span></div>
            <button type="button" onClick={dismissOfflineReady} aria-label="关闭离线提示"><X size={16} /></button>
          </aside>
        )}

        {updateAvailable && (
          <aside className="pwa-notice update-notice" role="status">
            <ArrowClockwise size={20} />
            <div>
              <strong>网站内容已更新</strong>
              <span>{targetVersion ? `新版本 ${targetVersion} 已准备好。` : '新版本已经准备好。'}收藏和阅读记录会保留。</span>
            </div>
            <button type="button" onClick={applyUpdate} disabled={isApplyingUpdate}>
              {isApplyingUpdate ? '正在更新…' : '立即更新'}
            </button>
            <button type="button" onClick={dismissUpdate} disabled={isApplyingUpdate} aria-label="稍后更新"><X size={16} /></button>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
