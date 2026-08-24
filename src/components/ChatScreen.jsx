import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowClockwise, ArrowRight, PaperPlaneTilt } from '@phosphor-icons/react'
import brandCloud from '../assets/brand-cloud.png'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import mistLake from '../assets/mist-lake-lotus-chat-fade.png'
import './ChatScreen.css'

export default function ChatScreen({
  messages,
  draft,
  status,
  error,
  prompts,
  onBack,
  onRestart,
  onDraftChange,
  onSubmit,
  onPrompt,
}) {
  const messageEndRef = useRef(null)
  const isWelcome = messages.length === 1

  useEffect(() => {
    if (isWelcome && status !== 'sending') return
    messageEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [isWelcome, messages, status])

  return (
    <section className={`chat-screen ${isWelcome ? 'chat-screen--welcome' : 'chat-screen--active'}`} data-view="chat">
      <img className="chat-landscape" src={mistLake} alt="" />
      <header className="chat-header">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> 首页</button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <button className="chat-restart" type="button" onClick={onRestart}><ArrowClockwise size={15} /> 重新开始</button>
      </header>

      <div className="chat-content">
        <div className="chat-intro">
          <img src={brandCloud} alt="" />
          <p>与觉聊聊</p>
          <h1 data-route-heading tabIndex="-1">慢慢说，我在听。</h1>
        </div>

        <div className="chat-thread" aria-live="polite" aria-label="与觉的对话">
          {messages.map((message) => (
            <article className={`chat-message chat-message--${message.role}`} key={message.id}>
              <span className="chat-message__name">{message.role === 'assistant' ? '觉' : '您'}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {status === 'sending' && (
            <div className="chat-thinking" role="status"><i /><i /><i /><span>觉正在静静听您说。</span></div>
          )}
          <div className="chat-thread-end" ref={messageEndRef} />
        </div>

        {isWelcome && (
          <div className="chat-prompt-area">
            <p>如果一时不知道怎么开口</p>
            <div className="chat-prompts" aria-label="示例问题">
              {prompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => onPrompt(prompt)}>
                  <span>{prompt}</span><ArrowRight size={22} weight="light" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={onSubmit}>
        <label>
          <span className="sr-only">写下此刻的困惑</span>
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value.slice(0, 1200))}
            placeholder="写下此刻的困惑"
            rows="1"
            disabled={status === 'sending'}
          />
        </label>
        <button type="submit" disabled={!draft.trim() || status === 'sending'} aria-label="发送给觉"><PaperPlaneTilt size={24} /></button>
      </form>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <p className="chat-disclaimer">对话只留存在当前浏览器本地，内容仅供自我觉察，不替代医疗、心理或法律专业意见。</p>
    </section>
  )
}
