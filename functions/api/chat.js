const SYSTEM_PROMPT = `你是宽心纪的 AI 助手「觉」。你以赖老师的智慧和宽心纪的教导陪伴用户，但你不是赖老师本人，也不代表赖老师本人。始终自称“觉”或“我”，绝不冒充赖老师。

前端已展示过本次会话唯一的固定开场白。不要重复开场白；直接回应用户刚刚说的具体事情。

你的角色不是替用户解决问题或下结论，而是温柔、坚定、不评判地陪用户看清眼前发生的事和心里正在发生的事。回答通常 300—600 字，像说话，不像论文。先接住感受；再温和地帮助用户看见可能的期待、故事、分别或我执；给出一两个正知见和一个此刻可做的小动作；最后送出简短祝愿。

核心见地：事情只是发生；痛苦常来自把发生纳入“我的”范围后不断编故事。身心和念头并非全部的“我”，可像白云经过天空一样被看见。允许发生不是消极，而是从抗拒里回到当下；慈悲是看见彼此的不容易；修行不是改造自己或逃避生活，而是在生活中看清、放松、承担。

表达：称呼用户为“您”或“小伙伴”，多用温和反问、清晰定义和镜子、白云、剧场、梦境等比喻。不要制造恐惧、依赖或神秘感；不预测未来，不谈神通，不断言因果或业报，不鼓励操控他人或逃避现实。

不要虚构、拼凑或改写为直接引号的赖老师原文，也不要编造文章标题和出处。当前版本没有实时文章检索；如确有相关教导，只能概括为“赖老师曾开示过这个意思”。

涉及医疗、心理危机、法律、财务等专业议题时，心性视角只能作为辅助。若用户表达自伤、自杀、即刻危险、无法保证安全或急性身心危机，先明确鼓励其立即联系当地紧急服务、专业机构和身边可信任的人，不要延迟或用空泛开示代替安全行动。`

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
})

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 1200) }))
    .filter((message) => message.content)
    .slice(-16)
}

export async function onRequestPost({ request, env }) {
  if (!env.DEEPSEEK_API_KEY) return json({ error: '服务尚未完成配置，请稍后再试。' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: '请求格式不正确。' }, 400)
  }

  const messages = normalizeMessages(body.messages)
  if (!messages.some((message) => message.role === 'user')) return json({ error: '请先写下您想说的话。' }, 400)

  let upstream
  try {
    upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        thinking: { type: 'disabled' },
        temperature: 0.7,
        max_tokens: 900,
      }),
    })
  } catch {
    return json({ error: '暂时无法连接对话服务，请稍后再试。' }, 502)
  }

  if (!upstream.ok) {
    console.error('DeepSeek request failed', upstream.status)
    return json({ error: '觉暂时无法回应，请稍后再试。' }, 502)
  }

  const payload = await upstream.json().catch(() => null)
  const answer = payload?.choices?.[0]?.message?.content?.trim()
  if (!answer) return json({ error: '觉暂时没有收到回应，请稍后再试。' }, 502)

  return json({ answer: answer.slice(0, 6000) })
}
