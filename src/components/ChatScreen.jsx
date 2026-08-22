import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowClockwise, PaperPlaneTilt } from '@phosphor-icons/react'
import brandCloud from '../assets/brand-cloud.png'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, status])

  return (
    <section className="chat-screen" data-view="chat">
      <header className="chat-header">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> 首页</button>
        <img src={kuanxinLogo} alt="宽心纪" />
        <button className="chat-restart" type="button" onClick={onRestart}><ArrowClockwise size={15} /> 重新开始</button>
      </header>

      <div className="chat-intro">
        <img src={brandCloud} alt="" />
        <p>与觉聊聊</p>
        <h1 data-route-heading tabIndex="-1">不必说得很完整。</h1>
        <span>觉会陪您先看清眼前，也看看心里正在发生什么。</span>
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
        <div ref={messageEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="chat-prompts" aria-label="示例问题">
          {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPrompt(prompt)}>{prompt}</button>)}
        </div>
      )}

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
        <button type="submit" disabled={!draft.trim() || status === 'sending'} aria-label="发送给觉"><PaperPlaneTilt size={20} /></button>
      </form>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <p className="chat-disclaimer">对话只暂存于当前浏览器会话，内容仅供自我觉察，不替代医疗、心理或法律专业意见。</p>
    </section>
  )
}
