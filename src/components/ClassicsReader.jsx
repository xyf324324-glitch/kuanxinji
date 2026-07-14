import { useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarDots,
  LinkSimple,
  Path,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import { classicsItems, classicsMeta, getClassic } from '../content/classics'
import './ClassicsReader.css'

function ClassicsReader({ classicId, onBack, onNavigate, onOpenCalendar, onOpenMeridians }) {
  const navRef = useRef(null)
  const item = getClassic(classicId)
  const itemIndex = classicsItems.findIndex((entry) => entry.id === item.id)
  const previousItem = classicsItems[itemIndex - 1]
  const nextItem = classicsItems[itemIndex + 1]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    })
  }, [item.id])

  return (
    <section className="classics-screen">
      <header className="classics-header">
        <button type="button" onClick={onBack}><ArrowLeft size={18} /> 内容</button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <span>{String(item.sequence).padStart(2, '0')} / 12</span>
      </header>

      <main className="classics-main">
        <header className="classics-intro">
          <div><BookOpenText size={18} weight="light" /> 经典阅读 · 原典小笺</div>
          <h1>{classicsMeta.title}</h1>
          <p>{classicsMeta.subtitle}。每次只读一句，让古人的生活观察在今天重新有了落点。</p>
        </header>

        <nav className="classics-ribbon" aria-label="内经小笺篇目" ref={navRef}>
          {classicsItems.map((entry) => (
            <button
              key={entry.id}
              className={entry.id === item.id ? 'is-active' : ''}
              type="button"
              onClick={() => onNavigate(entry.id)}
              aria-current={entry.id === item.id ? 'page' : undefined}
            >
              <small>{String(entry.sequence).padStart(2, '0')}</small>
              <span>{entry.theme}</span>
            </button>
          ))}
        </nav>

        <div className="classics-layout">
          <aside className="classics-index" aria-label="十二则小笺目录">
            <p>十二则小笺</p>
            {classicsItems.map((entry) => (
              <button
                key={entry.id}
                className={entry.id === item.id ? 'is-active' : ''}
                type="button"
                onClick={() => onNavigate(entry.id)}
              >
                <span>{String(entry.sequence).padStart(2, '0')}</span>
                <div><small>{entry.theme}</small><strong>{entry.title}</strong></div>
              </button>
            ))}
          </aside>

          <article className="classics-article">
            <header className="classics-title">
              <p>第 {item.sequence} 笺 · {item.theme}</p>
              <h2>{item.title}</h2>
              <span>{item.lead}</span>
            </header>

            <section className="classics-quote" aria-labelledby="classic-quote-title">
              <span>原典</span>
              <blockquote id="classic-quote-title">“{item.quote}”</blockquote>
              <cite>—— {item.source}</cite>
            </section>

            <section className="classics-phrases" aria-labelledby="classic-phrases-title">
              <div className="classics-section-title">
                <span>逐句读</span>
                <h3 id="classic-phrases-title">先把字面读清楚</h3>
              </div>
              <ol>
                {item.phrases.map((phrase, index) => (
                  <li key={phrase.text}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{phrase.text}</strong><p>{phrase.note}</p></div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="classics-interpretation" aria-labelledby="classic-reading-title">
              <div className="classics-section-title">
                <span>今天怎样读</span>
                <h3 id="classic-reading-title">不照搬古法，只留下可用的观察</h3>
              </div>
              <p>{item.interpretation}</p>
            </section>

            <section className="classics-prompt" aria-labelledby="classic-prompt-title">
              <Sparkle size={19} weight="light" />
              <div><span>留给今日</span><p id="classic-prompt-title">{item.todayPrompt}</p></div>
            </section>

            <section className="classics-related" aria-labelledby="classic-related-title">
              <div className="classics-section-title">
                <span>沿着这句话继续读</span>
                <h3 id="classic-related-title">四时与经络</h3>
              </div>
              <div>
                <button type="button" onClick={onOpenCalendar}>
                  <CalendarDots size={20} weight="light" />
                  <span><small>二十四节气</small><strong>回到四时日历</strong></span>
                  <ArrowRight size={16} />
                </button>
                <button type="button" onClick={onOpenMeridians}>
                  <Path size={20} weight="light" />
                  <span><small>传统知识</small><strong>打开经络图志</strong></span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            <section className="classics-boundary" aria-labelledby="classic-boundary-title">
              <ShieldCheck size={20} weight="light" />
              <div>
                <h3 id="classic-boundary-title">阅读边界</h3>
                <p>本页用于传统文化与一般健康知识阅读。古代概念不能替代现代医学诊断，也不据此判断体质、疾病或自行治疗；身体不适请咨询专业医疗人员。</p>
              </div>
            </section>

            <footer className="classics-sources">
              <p>资料来源与编辑说明</p>
              <ul>
                {classicsMeta.sources.map((source) => (
                  <li key={source.title}>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title} <LinkSimple size={14} /></a>
                  </li>
                ))}
              </ul>
              <small>{classicsMeta.editorialNote} · 内容版本 {classicsMeta.version}</small>
            </footer>

            <nav className="classics-pagination" aria-label="相邻小笺">
              {previousItem ? (
                <button type="button" onClick={() => onNavigate(previousItem.id)}>
                  <ArrowLeft size={17} /><span><small>上一笺</small>{previousItem.theme}</span>
                </button>
              ) : <span />}
              {nextItem ? (
                <button type="button" onClick={() => onNavigate(nextItem.id)}>
                  <span><small>下一笺</small>{nextItem.theme}</span><ArrowRight size={17} />
                </button>
              ) : (
                <button type="button" onClick={onOpenCalendar}>
                  <span><small>读完十二笺</small>回到四时</span><ArrowRight size={17} />
                </button>
              )}
            </nav>
          </article>
        </div>
      </main>
    </section>
  )
}

export default ClassicsReader
