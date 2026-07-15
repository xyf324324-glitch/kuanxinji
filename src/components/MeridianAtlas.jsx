import { useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Heartbeat,
  LinkSimple,
  ShieldCheck,
} from '@phosphor-icons/react'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import { getMeridian, meridianItems, meridianMeta } from '../content/meridians'
import './MeridianAtlas.css'

function MeridianAtlas({ meridianId, onBack, onNavigate, onOpenClassics }) {
  const navRef = useRef(null)
  const item = getMeridian(meridianId)
  const itemIndex = meridianItems.findIndex((entry) => entry.id === item.id)
  const previousItemIndexRef = useRef(itemIndex)
  const pageDirection = itemIndex < previousItemIndexRef.current ? 'previous' : 'next'
  const previousItem = meridianItems[itemIndex - 1]
  const nextItem = meridianItems[itemIndex + 1]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const activeButton = navRef.current?.querySelector('[aria-current="page"]')
    activeButton?.scrollIntoView({ block: 'nearest', inline: 'center' })
    previousItemIndexRef.current = itemIndex
  }, [item.id, itemIndex])

  return (
    <section className="meridian-screen">
      <header className="meridian-header">
        <button type="button" onClick={onBack}><ArrowLeft size={18} /> 内容</button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <span>{item.sequence} / 12</span>
      </header>

      <main className="meridian-main">
        <header className="meridian-intro">
          <div><Heartbeat size={18} weight="light" /> 传统知识 · 经络图志</div>
          <h1>十二经络</h1>
          <p>沿着古人的命名与循行次序，认识十二经脉怎样首尾相接。这里呈现的是知识地图，不是身体自测工具。</p>
        </header>

        <nav className="meridian-cycle" aria-label="十二经络循行次序" ref={navRef}>
          {meridianItems.map((entry) => (
            <button
              key={entry.id}
              className={entry.id === item.id ? 'is-active' : ''}
              type="button"
              onClick={() => onNavigate(entry.id)}
              aria-current={entry.id === item.id ? 'page' : undefined}
            >
              <small>{String(entry.sequence).padStart(2, '0')}</small>
              <span>{entry.shortName}</span>
            </button>
          ))}
        </nav>

        <div className="meridian-layout">
          <aside className="meridian-index" aria-label="十二经络目录">
            <p>循行次序</p>
            {meridianItems.map((entry) => (
              <button
                key={entry.id}
                className={entry.id === item.id ? 'is-active' : ''}
                type="button"
                onClick={() => onNavigate(entry.id)}
              >
                <span>{String(entry.sequence).padStart(2, '0')}</span>
                <strong>{entry.name}</strong>
              </button>
            ))}
          </aside>

          <article className={`meridian-article meridian-article--${pageDirection}`} key={item.id}>
            <header className="meridian-title">
              <p>{item.group} · 第{item.sequence}经</p>
              <h2>{item.name}</h2>
              <span>{item.direction}</span>
            </header>

            <section className="meridian-name" aria-labelledby="meridian-name-title">
              <h3 id="meridian-name-title">先读懂名字</h3>
              <dl>
                <div><dt>{item.name.startsWith('手') ? '手' : '足'}</dt><dd>{item.name.startsWith('手') ? '主要经过上肢' : '主要经过下肢'}</dd></div>
                <div><dt>{item.yinYang}</dt><dd>阴阳分级</dd></div>
                <div><dt>{item.organ}</dt><dd>传统所属脏腑</dd></div>
              </dl>
              <p>{item.nameNote}</p>
            </section>

            <section className="meridian-route" aria-labelledby="meridian-route-title">
              <div className="meridian-route__heading">
                <div><span>循行概览</span><h3 id="meridian-route-title">{item.start} → {item.end}</h3></div>
                <small>示意路线 · 非解剖定位</small>
              </div>
              <ol>
                {item.routeNodes.map((node, index) => (
                  <li key={node}>
                    <span>{index + 1}</span>
                    <strong>{node}</strong>
                  </li>
                ))}
              </ol>
              <p>{item.overview}</p>
            </section>

            <section className="meridian-pair" aria-labelledby="meridian-pair-title">
              <div>
                <span>表里相配</span>
                <h3 id="meridian-pair-title">{item.paired}</h3>
              </div>
              <p>{item.readingNote}</p>
            </section>

            <section className="meridian-classic" aria-labelledby="meridian-classic-title">
              <BookOpenText size={22} weight="light" />
              <div>
                <span>原典一则</span>
                <blockquote id="meridian-classic-title">“{meridianMeta.classic.quote}”</blockquote>
                <cite>- {meridianMeta.classic.source}</cite>
                <p>{meridianMeta.classic.note}</p>
              </div>
            </section>

            <section className="meridian-safety" aria-labelledby="meridian-safety-title">
              <ShieldCheck size={21} weight="light" />
              <div>
                <h3 id="meridian-safety-title">阅读边界</h3>
                <p>本页不根据疼痛、颜色、触感或其他症状判断经络状态，也不提供针刺、艾灸、穴位按压与治疗指导。身体不适请咨询专业医疗人员。</p>
              </div>
            </section>

            <footer className="meridian-sources">
              <p>资料来源与编辑说明</p>
              <ul>
                {meridianMeta.sources.map((source) => (
                  <li key={source.title}>
                    {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title} <LinkSimple size={14} /></a> : source.title}
                  </li>
                ))}
              </ul>
              <small>{meridianMeta.editorialNote} · 内容版本 {meridianMeta.version}</small>
            </footer>

            <nav className="meridian-pagination" aria-label="相邻经络">
              {previousItem ? (
                <button type="button" onClick={() => onNavigate(previousItem.id)}>
                  <ArrowLeft size={17} /><span><small>上一经</small>{previousItem.shortName}</span>
                </button>
              ) : <span />}
              {nextItem ? (
                <button type="button" onClick={() => onNavigate(nextItem.id)}>
                  <span><small>下一经</small>{nextItem.shortName}</span><ArrowRight size={17} />
                </button>
              ) : (
                <button type="button" onClick={onOpenClassics}>
                  <span><small>继续阅读</small>内经小笺</span><ArrowRight size={17} />
                </button>
              )}
            </nav>
          </article>
        </div>
      </main>
    </section>
  )
}

export default MeridianAtlas
