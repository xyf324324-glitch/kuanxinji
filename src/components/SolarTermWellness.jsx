import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Heartbeat,
  Leaf,
  LinkSimple,
  Quotes,
  ShareNetwork,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import {
  getSolarTermWellness,
  solarTermWellnessItems,
  solarTermWellnessMeta,
} from '../content/solar-terms'
import './SolarTermWellness.css'

function SolarTermWellness({ term, onBack, onNavigate, onOpenMeridians }) {
  const [shared, setShared] = useState(false)
  const termNavRef = useRef(null)
  const item = getSolarTermWellness(term) || solarTermWellnessItems[0]
  const itemIndex = solarTermWellnessItems.findIndex((entry) => entry.id === item.id)
  const previousItem = solarTermWellnessItems[itemIndex - 1]
  const nextItem = solarTermWellnessItems[itemIndex + 1]
  const shareText = useMemo(() => `${item.term}｜${item.subtitle}\n${item.todayNote}`, [item])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setShared(false)
    const activeButton = termNavRef.current?.querySelector('[aria-current="page"]')
    activeButton?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [item.id])

  const sharePage = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `宽心纪 · ${item.term}养生`, text: shareText, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
      }
      setShared(true)
    } catch (error) {
      if (error?.name !== 'AbortError') setShared(false)
    }
  }

  return (
    <section className="wellness-screen">
      <header className="wellness-header">
        <button type="button" onClick={onBack}><ArrowLeft size={18} /> 日历</button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <button type="button" onClick={sharePage} aria-label={`分享${item.term}养生`}>
          <ShareNetwork size={18} /> <span>{shared ? '已复制' : '分享'}</span>
        </button>
      </header>

      <main className="wellness-main">
        <nav className="wellness-term-nav" aria-label="二十四节气养生" ref={termNavRef}>
          {solarTermWellnessItems.map((entry) => (
            <button
              key={entry.id}
              className={entry.id === item.id ? 'is-active' : ''}
              type="button"
              onClick={() => onNavigate(entry.id)}
              aria-current={entry.id === item.id ? 'page' : undefined}
            >
              {entry.term}
            </button>
          ))}
        </nav>

        <article className="wellness-article" key={item.id}>
          <header className="wellness-hero">
            <div className="wellness-hero__eyebrow"><Leaf size={16} /> 四时养生 · 第{item.sequence}节气</div>
            <p className="wellness-hero__season">{item.season} · {item.period}</p>
            <h1>{item.term}</h1>
            <h2>{item.subtitle}</h2>
            <p className="wellness-hero__lead">{item.lead}</p>
            <div className="wellness-phenology" aria-label={`${item.term}三候`}>
              {item.phenology.map((entry, index) => (
                <span key={entry}><small>第{['一', '二', '三'][index]}候</small>{entry}</span>
              ))}
            </div>
          </header>

          <section className="wellness-classic" aria-labelledby="classic-title">
            <div className="wellness-section-mark"><Quotes size={21} weight="light" /></div>
            <div>
              <p className="wellness-kicker">内经小笺</p>
              <blockquote id="classic-title">“{item.classic.quote}”</blockquote>
              <cite>- {item.classic.source}</cite>
              <p>{item.classic.note}</p>
            </div>
          </section>

          <section className="wellness-tradition" aria-labelledby="tradition-title">
            <div className="wellness-section-title">
              <BookOpenText size={22} weight="light" />
              <div><p>传统知识</p><h2 id="tradition-title">{item.tradition.title}</h2></div>
            </div>
            <p>{item.tradition.body}</p>
          </section>

          <section className="wellness-daily" aria-labelledby="daily-title">
            <div className="wellness-section-title">
              <Sparkle size={22} weight="light" />
              <div><p>顺时而行</p><h2 id="daily-title">今日生活四事</h2></div>
            </div>
            <div className="wellness-daily__list">
              {item.dailyLife.map((entry, index) => (
                <article key={entry.label}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div><h3>{entry.label}</h3><p>{entry.text}</p></div>
                </article>
              ))}
            </div>
          </section>

          <aside className="wellness-note">
            <span>今日一页</span>
            <p>{item.todayNote.replace('今日小笺：', '')}</p>
          </aside>

          <section className="wellness-safety" aria-labelledby="safety-title">
            <ShieldCheck size={22} weight="light" />
            <div>
              <h2 id="safety-title">阅读提醒</h2>
              <p>{item.caution}</p>
              <p>本栏目用于传统文化与一般健康知识阅读，不提供诊断、处方或个体化治疗建议，不能替代专业医疗服务。</p>
            </div>
          </section>

          <footer className="wellness-sources">
            <p>资料来源与编辑说明</p>
            <ul>
              {item.sources.map((source) => (
                <li key={source.title}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title} <LinkSimple size={14} /></a>
                  ) : source.title}
                </li>
              ))}
            </ul>
            <small>{solarTermWellnessMeta.editorialNote} · 内容版本 {solarTermWellnessMeta.version}</small>
          </footer>

          <button className="wellness-library-link" type="button" onClick={onOpenMeridians}>
            <Heartbeat size={22} weight="light" />
            <span><small>继续认识传统知识</small><strong>十二经络图志</strong></span>
            <ArrowRight size={18} />
          </button>

          <nav className="wellness-pagination" aria-label="相邻节气养生">
            {previousItem ? (
              <button type="button" onClick={() => onNavigate(previousItem.id)}>
                <ArrowLeft size={17} /><span><small>上一节气</small>{previousItem.term}</span>
              </button>
            ) : <span />}
            {nextItem ? (
              <button type="button" onClick={() => onNavigate(nextItem.id)}>
                <span><small>下一节气</small>{nextItem.term}</span><ArrowRight size={17} />
              </button>
            ) : <span />}
          </nav>
        </article>
      </main>
    </section>
  )
}

export default SolarTermWellness
