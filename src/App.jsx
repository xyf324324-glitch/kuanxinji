import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowClockwise,
  ArrowRight,
  Article,
  BookmarkSimple,
  BookOpenText,
  Books,
  CaretRight,
  CheckCircle,
  Copy,
  List,
  Leaf,
  MagnifyingGlass,
  PaperPlaneTilt,
  ShareNetwork,
  WifiSlash,
  X,
} from '@phosphor-icons/react'
import mistLake from './assets/mist-lake-lotus.jpg'
import kuanxinLogo from './assets/kuanxin-logo-transparent.png'
import answerButtonReference from './assets/answer-button-reference.png'
import brandCloud from './assets/brand-cloud.png'
import footerDot from './assets/footer-dot.png'
import { articles, loadArticle, rankArticles } from './content'
import contentVersion from './content/content-version.json'
import {
  listSavedArticles,
  loadReadingProgress,
  removeSavedArticle,
  saveArticle,
  saveReadingProgress,
} from './lib/library'
import { usePwaStatus } from './hooks/usePwaStatus'
import './index.css'

const prompts = [
  '我放不下一段关系，怎么办？',
  '为什么我总在情绪里反复？',
  '修行时感到迷茫，该如何看待？',
  '面对家人，我总是很疲惫。',
  '最近发生的一切，到底在提醒我什么？',
]

const homeLines = [
  '给忙碌的心，留一处可以停靠的地方。',
  '慢一点，也是在好好生活。',
  '先安住此刻，再看清前路。',
  '风来有时，心静自明。',
  '不必急着回答，先听一听内心。',
  '愿你在一段文字里，遇见片刻安宁。',
  '把纷扰放轻一些，把自己照顾好一些。',
  '今日所遇，也可以慢慢体会。',
  '心有余地，生活便有转身之处。',
  '在来去之间，给自己一点从容。',
  '不追赶答案，先回到当下。',
  '愿这一刻，清明而柔软。',
  '一念放轻，天地便宽。',
  '看见情绪，也看见情绪之外的自己。',
  '允许万事经过，也允许自己歇一歇。',
  '读一段文字，听一听心里的回声。',
  '山水有静意，日常亦有光。',
  '有些答案，会在安静里慢慢出现。',
  '愿你不慌不忙，走好此刻这一程。',
  '让念头来去，不必事事握紧。',
  '心若清明，寻常日子也有深意。',
  '给今日一点留白，也给自己一点空间。',
  '读到触动处，不妨停一停。',
  '于方寸之间，愿你慢慢宽心。',
]

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
  const [dailyVisible, setDailyVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [question, setQuestion] = useState(() => window.sessionStorage.getItem('kuanxin-question') || '')
  const [shared, setShared] = useState(false)
  const [saved, setSaved] = useState(false)
  const [homeLineIndex, setHomeLineIndex] = useState(0)
  const [savedArticleIds, setSavedArticleIds] = useState([])
  const [readingProgress, setReadingProgress] = useState({})
  const [articleQuery, setArticleQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState('全部')
  const [visibleArticleCount, setVisibleArticleCount] = useState(20)
  const {
    isOnline,
    offlineReady,
    updateAvailable,
    dismissOfflineReady,
    dismissUpdate,
    applyUpdate,
  } = usePwaStatus()

  useEffect(() => {
    Promise.all([listSavedArticles(), loadReadingProgress()]).then(([savedEntries, progressEntries]) => {
      setSavedArticleIds(savedEntries.map((entry) => entry.id))
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
        setArticleOrigin(['search', 'library', 'articles'].includes(origin) ? origin : 'result')
        setView('article')
      } else if (section === 'answer' && matchedArticle) {
        setArticle(matchedArticle)
        setView('result')
      } else if (section === 'search') {
        setView('search')
      } else if (section === 'library') {
        setView('library')
      } else if (section === 'content') {
        setView('content')
      } else if (section === 'articles') {
        setView('articles')
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
    const timer = window.setTimeout(() => setDailyVisible(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (view !== 'article') return undefined
    window.scrollTo({ top: 0, behavior: 'instant' })
    let saveTimer

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
      const normalized = Math.max(0, Math.min(100, Math.round(progress)))
      setReadingProgress((current) => ({ ...current, [article.id]: normalized }))
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => saveReadingProgress(article.id, normalized), 250)
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.clearTimeout(saveTimer)
    }
  }, [view, article.id])

  useEffect(() => {
    const closeOverlays = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      setAskOpen(false)
      setDailyVisible(false)
    }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])

  const searchResult = useMemo(() => rankArticles(question), [question])
  const recommendations = searchResult.items
  const hasCloseMatch = searchResult.hasCloseMatch
  const isHighRisk = /自杀|自伤|不想活|活不下去|结束生命|极度绝望|严重疾病|重病/.test(question)
  const savedArticles = articles.filter((item) => savedArticleIds.includes(item.id))
  const articleIsSaved = savedArticleIds.includes(article.id)
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

  const begin = () => {
    setMenuOpen(false)
    setAskOpen(false)
    setView('breathing')
    window.location.hash = '/breathing'
  }

  const openArticle = async (nextArticle = article, origin = view) => {
    const normalizedOrigin = ['search', 'library', 'articles'].includes(origin) ? origin : 'result'
    const fullArticle = nextArticle.paragraphs ? nextArticle : await loadArticle(nextArticle.id)
    setArticle(fullArticle)
    setArticleOrigin(normalizedOrigin)
    setAskOpen(false)
    setView('article')
    window.location.hash = `/article/${fullArticle.id}?from=${normalizedOrigin}`
  }

  const goHome = () => {
    setAskOpen(false)
    setMenuOpen(false)
    setView('home')
    window.location.hash = '/'
  }

  const returnFromArticle = () => {
    setView(articleOrigin)
    const returnRoute = articleOrigin === 'search'
      ? '/search'
      : articleOrigin === 'library'
        ? '/library'
        : articleOrigin === 'articles'
          ? '/articles'
        : `/answer/${article.id}`
    window.location.hash = returnRoute
  }

  const openLibrary = () => {
    setMenuOpen(false)
    setView('library')
    window.location.hash = '/library'
  }

  const openContent = () => {
    setMenuOpen(false)
    setView('content')
    window.location.hash = '/content'
  }

  const openArticles = () => {
    setMenuOpen(false)
    setView('articles')
    window.location.hash = '/articles'
  }

  const toggleSavedArticle = async (targetArticle = article) => {
    const isSaved = savedArticleIds.includes(targetArticle.id)
    if (isSaved) {
      await removeSavedArticle(targetArticle.id)
      setSavedArticleIds((current) => current.filter((id) => id !== targetArticle.id))
    } else {
      await saveArticle(targetArticle)
      setSavedArticleIds((current) => [...new Set([...current, targetArticle.id])])
    }
  }

  const openOriginalArticle = () => {
    if (!article.sourceUrl) {
      window.alert('这篇内容暂未配置公众号原文链接。')
      return
    }
    window.open(article.sourceUrl, '_blank', 'noopener,noreferrer')
  }

  const submitQuestion = (event) => {
    event.preventDefault()
    if (!question.trim()) return
    window.sessionStorage.setItem('kuanxin-question', question.trim())
    setView('search')
    window.location.hash = '/search'
  }

  const switchHomeLine = () => {
    setHomeLineIndex((current) => (current + 1 + Math.floor(Math.random() * (homeLines.length - 1))) % homeLines.length)
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
      <main className="mobile-prototype" aria-label="宽心纪答案之书原型">
        {view === 'home' && (
          <section className="hero-screen reference-home" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="topbar">
              <button className="brand" type="button" onClick={goHome} aria-label="回到宽心纪首页">
                <img src={kuanxinLogo} alt="宽心纪" />
                <span>愿您宽心</span>
              </button>
              <button className="icon-button menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="打开导航">
                {menuOpen ? <X size={28} weight="light" /> : <List size={31} weight="light" />}
              </button>
            </header>

            {menuOpen && (
              <nav className="menu-panel" aria-label="主导航">
                <button type="button" onClick={openContent}>慢慢阅读 · 内容总览</button>
                <button type="button" onClick={begin}>答案之书</button>
                <button type="button" onClick={() => setAskOpen(true)}>此刻有什么想问？</button>
                <button type="button" onClick={openLibrary}>离线书架 · {savedArticleIds.length}篇</button>
                <button type="button" onClick={() => setMenuOpen(false)}>节气日历 · 敬请期待</button>
                <button type="button" onClick={() => setMenuOpen(false)}>经典阅读 · 敬请期待</button>
              </nav>
            )}

            <div className="hero-center">
              <h1>答案之书</h1>
              <img className="title-cloud" src={brandCloud} alt="" />
              <p className="settle-copy">请安静片刻</p>
              <button className="open-book" type="button" onClick={begin} aria-label="开启答案之书">
                <img src={answerButtonReference} alt="" />
              </button>
            </div>

            <button className="ask-entry" type="button" onClick={() => setAskOpen(true)}>
              此刻有什么想问？ <ArrowRight size={17} weight="light" />
            </button>

            <div className="home-footer-arc">
              <img className="footer-dot" src={footerDot} alt="" />
              <button className="home-note" type="button" onClick={switchHomeLine} aria-label="换一句首页文案">
                {homeLines[homeLineIndex]}
              </button>
            </div>
          </section>
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
              <button type="button" onClick={begin}>再抽一次</button>
            </div>
            <p className="result-caution">若心里仍很乱，不妨先读完这一篇，再决定是否重抽。</p>
            <p className="result-signature">宽心纪 · 愿您宽心</p>
          </section>
        )}

        {view === 'content' && (
          <section className="content-screen" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="result-header">
              <button className="back-button" type="button" onClick={goHome}><ArrowLeft size={18} /> 首页</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="content-intro">
              <img src={brandCloud} alt="" />
              <h1>在文字里，慢慢宽心</h1>
              <p>读老师的文章，也读四时与经典。无需赶路，从此刻最想读的一页开始。</p>
            </div>
            <div className="content-paths">
              <section className="teacher-path">
                <div className="path-heading">
                  <Article size={23} weight="light" />
                  <div><span>老师文章</span><h2>从困惑，回到当下</h2></div>
                </div>
                <p>按主题、关键词和此刻的困惑寻找文章。当前已整理 {articles.length} 篇公众号文章。</p>
                <div className="teacher-preview">
                  {articles.slice(0, 3).map((item) => (
                    <button key={item.id} type="button" onClick={() => openArticle(item, 'articles')}>
                      <span>{item.theme}</span><strong>{item.title}</strong><CaretRight size={16} />
                    </button>
                  ))}
                </div>
                <button className="path-action" type="button" onClick={openArticles}>进入老师文章库 <ArrowRight size={16} /></button>
              </section>

              <div className="coming-paths" aria-label="即将开放的内容">
                <section>
                  <Leaf size={22} weight="light" />
                  <div><span>二十四节气</span><h2>顺四时，养身心</h2><p>节气物候、日常起居与一般养生科普。</p></div>
                  <small>内容整理中</small>
                </section>
                <section>
                  <BookOpenText size={22} weight="light" />
                  <div><span>经典阅读</span><h2>每日读一小章</h2><p>按章节阅读传统经典，保留离线进度。</p></div>
                  <small>内容整理中</small>
                </section>
              </div>

              <button className="content-library-entry" type="button" onClick={openLibrary}>
                <Books size={22} weight="light" />
                <span><strong>离线书架</strong><small>{savedArticleIds.length ? `已有 ${savedArticleIds.length} 篇保存在本机` : '把想反复读的文字留在手机里'}</small></span>
                <CaretRight size={17} />
              </button>
            </div>
          </section>
        )}

        {view === 'articles' && (
          <section className="articles-screen">
            <header className="article-header">
              <button className="back-button" type="button" onClick={openContent}><ArrowLeft size={18} /> 内容</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="articles-intro">
              <div><img src={brandCloud} alt="" /><span>老师文章</span></div>
              <h1>此刻，想读些什么？</h1>
              <p>可以按主题慢慢翻，也可以写下一个词。搜索只在这台设备上进行。</p>
              <label className="article-search">
                <MagnifyingGlass size={18} />
                <input value={articleQuery} onChange={(event) => setArticleQuery(event.target.value)} placeholder="搜索标题、主题或困惑" />
                {articleQuery && <button type="button" onClick={() => setArticleQuery('')} aria-label="清除搜索"><X size={16} /></button>}
              </label>
              <div className="theme-filters" aria-label="文章主题筛选">
                {articleThemes.map((theme) => (
                  <button className={theme === activeTheme ? 'active' : ''} key={theme} type="button" onClick={() => setActiveTheme(theme)}>{theme}</button>
                ))}
              </div>
            </div>
            <div className="article-catalog" aria-live="polite">
              {filteredArticles.length > 0 ? filteredArticles.slice(0, visibleArticleCount).map((item) => (
                <article key={item.id}>
                  <button className="catalog-open" type="button" onClick={() => openArticle(item, 'articles')}>
                    <span>{item.theme}</span>
                    <h2>{item.title}</h2>
                    <p>{item.quote}</p>
                    <small>{readingProgress[item.id] ? `上次读到 ${readingProgress[item.id]}%` : '开始阅读'}</small>
                    <CaretRight size={18} />
                  </button>
                  <button className="catalog-save" type="button" onClick={() => toggleSavedArticle(item)} aria-label={savedArticleIds.includes(item.id) ? `移除${item.title}` : `离线保存${item.title}`}>
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

        {view === 'article' && (
          <section className="article-screen">
            <header className="article-header">
              <button className="back-button" type="button" onClick={returnFromArticle}><ArrowLeft size={18} /> 返回</button>
              <img src={kuanxinLogo} alt="宽心纪" />
              <span className="reading-progress" style={{ '--reading-progress': `${readingProgress[article.id] || 0}%` }} aria-hidden="true" />
            </header>
            <article className="article-body">
              <div className="article-kicker"><img src={brandCloud} alt="" /><span>宽心阅读</span></div>
              <p className="article-theme">{article.theme}</p>
              <h2 className={article.title.length > 45 ? 'long-title' : ''}>{article.title}</h2>
              <div className="article-rule" />
              {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p className="article-signature">{article.sourceStatus === 'published-source' ? '— 赖宽心 · 整理自公众号原文' : '— 原型示例 · 上线前替换为经审核的授权原文'}</p>
              <section className="article-related" aria-label="继续阅读">
                <p>读完这一篇，再看看</p>
                {articles.filter((item) => item.id !== article.id).map((item) => (
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
              <button type="button" onClick={openOriginalArticle}><BookOpenText size={18} /> 公众号原文</button>
            </footer>
          </section>
        )}

        {view === 'library' && (
          <section className="library-screen" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="result-header">
              <button className="back-button" type="button" onClick={goHome}><ArrowLeft size={18} /> 首页</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="library-heading">
              <img src={brandCloud} alt="" />
              <p>离线书架</p>
              <h2>留在这台手机里的文字</h2>
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
                    <button className="library-remove" type="button" onClick={() => toggleSavedArticle(item)}>移出书架</button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="library-empty">
                <Books size={34} weight="light" />
                <strong>书架还是空的</strong>
                <p>读文章时点击“离线保存”，它就会留在这里。</p>
                <button type="button" onClick={goHome}>回首页看看</button>
              </div>
            )}
            <p className="library-version">本地内容版本 {contentVersion.version}</p>
          </section>
        )}

        {view === 'search' && (
          <section className="search-screen" style={{ '--mist-image': `url(${mistLake})` }}>
            <header className="result-header">
              <button className="back-button" type="button" onClick={goHome}><ArrowLeft size={18} /> 首页</button>
              <img src={kuanxinLogo} alt="宽心纪" />
            </header>
            <div className="search-result-copy">
              <div className="search-kicker"><img src={brandCloud} alt="" /><span>为此刻的心事寻文</span></div>
              <p>宽心提示 · 摘自推荐文章</p>
              <h2>{recommendations[0].quote}</h2>
              <span>{hasCloseMatch ? '以下是与此刻心事相近的宽心纪文章，供你慢慢读。' : '暂未找到非常接近的内容，你可以先参考这些相近主题。'}</span>
            </div>
            {isHighRisk && (
              <aside className="safety-note" role="alert">
                <strong>请先照顾好此刻的安全。</strong>
                <span>如果你正准备伤害自己、感到无法保证安全，或身体处于紧急状况，请立即联系身边可信任的人，并联系当地紧急服务或专业机构。以下内容不能替代医疗或心理专业帮助。</span>
              </aside>
            )}
            <div className="recommendations">
              {recommendations.map((item, index) => (
                <button key={item.id} type="button" onClick={() => openArticle(item)}>
                  <span>0{index + 1}</span>
                  <div><small>{index === 0 ? '最贴近' : '换一个角度看看'}</small><strong>{item.title}</strong><small>{item.quote}</small></div>
                  <CaretRight size={17} />
                </button>
              ))}
            </div>
          </section>
        )}

        {dailyVisible && view === 'home' && (
          <aside className="daily-zen-modal" role="dialog" aria-modal="true" aria-label="每日禅语">
            <button className="modal-close" type="button" onClick={() => setDailyVisible(false)} aria-label="关闭每日禅语"><X size={18} /></button>
            <p>每日禅语</p>
            <strong>心安处，便是归处。</strong>
            <span>愿您于今日，慢一点。</span>
          </aside>
        )}

        {askOpen && view === 'home' && (
          <aside className="ask-sheet" role="dialog" aria-modal="true" aria-label="提问检索">
            <button className="modal-close" type="button" onClick={() => setAskOpen(false)} aria-label="关闭提问"><X size={19} /></button>
            <p>此刻有什么想问？</p>
            <h2>不必说得很完整。</h2>
            <div className="prompt-list">
              {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}
            </div>
            <form onSubmit={submitQuestion}>
              <label>
                <MagnifyingGlass size={17} />
                <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="写下此刻的困惑" />
              </label>
              <button type="submit" aria-label="寻找相关文章"><PaperPlaneTilt size={19} /></button>
            </form>
            <small>内容仅供学习与自我觉察，不替代医疗或心理专业意见。</small>
          </aside>
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
            <div><strong>发现新的内容版本</strong><span>更新后可继续保留本机书架。</span></div>
            <button type="button" onClick={applyUpdate}>立即更新</button>
            <button type="button" onClick={dismissUpdate} aria-label="稍后更新"><X size={16} /></button>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
