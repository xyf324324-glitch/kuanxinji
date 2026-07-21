import { useEffect, useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ArrowLeft,
  DownloadSimple,
  ShareNetwork,
} from '@phosphor-icons/react'
import lunarPackage from 'lunar-javascript'
import QRCode from 'qrcode'
import kuanxinLogo from '../assets/kuanxin-logo-transparent.png'
import mistLake from '../assets/mist-lake-lotus.jpg'
import sayings from '../content/sayings'
import './SayingsCard.css'

const { Solar } = lunarPackage
const SITE_HOME = 'https://kuanxinji.pages.dev'
const CHINA_TIME_ZONE = 'Asia/Shanghai'
const NO_LINE_START = new Set('，。！？；：、）》」』】”’')
const NO_LINE_END = new Set('（《「『【“‘不没未无莫')
const NATURAL_BREAK = new Set('，。！？；：')
const SOFT_NO_LINE_START = new Set('的了着过吗呢吧啊呀而与和及或')
const SOFT_NO_LINE_END = new Set('的地得很更最才也又再仍只把被与和及或而但就都能要可让向为在当从将所因由')
const EDGE_PUNCTUATION = new Set('，。！？；：、）》」』】”’')

const quoteScales = {
  1: { min: 31, max: 43, fluid: 8.2, canvas: 76 },
  2: { min: 27, max: 38, fluid: 7.3, canvas: 68 },
  3: { min: 24, max: 34, fluid: 6.4, canvas: 60 },
  4: { min: 21, max: 30, fluid: 5.6, canvas: 53 },
  5: { min: 19, max: 27, fluid: 5.1, canvas: 47 },
  6: { min: 18, max: 25, fluid: 4.7, canvas: 43 },
  7: { min: 17, max: 23, fluid: 4.3, canvas: 39 },
  8: { min: 16, max: 21, fluid: 4, canvas: 36 },
}

function getChinaDateParts() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    monthText: values.month,
    dayText: values.day,
  }
}

function getTodayInfo() {
  const date = getChinaDateParts()
  const lunar = Solar.fromYmd(date.year, date.month, date.day).getLunar()
  const currentTerm = lunar.getJieQi() || lunar.getPrevJieQi().getName()
  const dateKey = `${date.year}-${date.monthText}-${date.dayText}`
  const dayNumber = Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86400000)

  return {
    dateKey,
    displayDate: `${date.year}.${date.monthText}.${date.dayText}`,
    traditionalDate: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} · ${currentTerm}`,
    dailyIndex: Math.abs((dayNumber * 17 + 11) % sayings.length),
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

function drawImageCover(context, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
}

function normalizeQuote(text) {
  return text.replace(/\s*\n\s*/g, '').trim()
}

function getTargetLineCount(length) {
  if (length <= 7) return 1
  if (length <= 16) return 2
  if (length <= 27) return 3
  if (length <= 39) return 4
  if (length <= 50) return 5
  if (length <= 60) return 6
  if (length <= 72) return 7
  return 8
}

function getOpticalLineLength(line) {
  const characters = Array.from(line)
  const finalCharacter = characters.at(-1)
  const glyphLength = characters.reduce(
    (total, character) => total + (EDGE_PUNCTUATION.has(character) ? .62 : 1),
    0,
  )
  return glyphLength + (EDGE_PUNCTUATION.has(finalCharacter) ? 1.15 : 0)
}

function getPreferredBreaks(text) {
  if (typeof Intl.Segmenter !== 'function') return new Set()
  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })
  return new Set(Array.from(segmenter.segment(text), ({ index, segment }) => index + Array.from(segment).length))
}

function balanceQuoteLines(text) {
  const normalized = normalizeQuote(text)
  const characters = Array.from(normalized)
  const targetLineCount = getTargetLineCount(characters.length)
  const idealLength = getOpticalLineLength(normalized) / targetLineCount
  const preferredBreaks = getPreferredBreaks(normalized)
  const memo = new Map()

  const findBest = (start, remainingLines) => {
    const memoKey = `${start}:${remainingLines}`
    if (memo.has(memoKey)) return memo.get(memoKey)

    const remainingCharacters = characters.length - start
    if (remainingLines === 1) {
      if (remainingCharacters < 1 || NO_LINE_START.has(characters[start])) return null
      const line = characters.slice(start).join('')
      const result = {
        score: (getOpticalLineLength(line) - idealLength) ** 2,
        lines: [line],
      }
      memo.set(memoKey, result)
      return result
    }

    let best = null
    const minimumEnd = start + Math.max(2, Math.floor(idealLength - 4))
    const maximumEnd = Math.min(
      characters.length - (remainingLines - 1) * 2,
      start + Math.ceil(idealLength + 4),
    )

    for (let end = minimumEnd; end <= maximumEnd; end += 1) {
      if (NO_LINE_START.has(characters[end]) || NO_LINE_END.has(characters[end - 1])) continue
      const next = findBest(end, remainingLines - 1)
      if (!next) continue

      const line = characters.slice(start, end).join('')
      const lineLength = getOpticalLineLength(line)
      let score = next.score + (lineLength - idealLength) ** 2
      if (NATURAL_BREAK.has(characters[end - 1])) score -= 10
      if (lineLength < idealLength * .68) score += 18
      if (SOFT_NO_LINE_END.has(characters[end - 1])) score += 54
      if (SOFT_NO_LINE_START.has(characters[end])) score += 54
      if (preferredBreaks.size && !preferredBreaks.has(end)) score += 22

      if (!best || score < best.score) {
        best = {
          score,
          lines: [line, ...next.lines],
        }
      }
    }

    memo.set(memoKey, best)
    return best
  }

  const balanced = findBest(0, targetLineCount)
  const lines = balanced?.lines || [normalized]
  const widestOpticalLine = Math.max(...lines.map(getOpticalLineLength))
  return {
    text: normalized,
    lines,
    scale: quoteScales[lines.length] || quoteScales[8],
    fit: 76 / widestOpticalLine,
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('图片生成失败'))
    }, 'image/png')
  })
}

export default function SayingsCard({ onBack }) {
  const today = useMemo(() => getTodayInfo(), [])
  const [sayingIndex, setSayingIndex] = useState(today.dailyIndex)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('今日一言，已经为你安静地留在这里。')
  const saying = sayings[sayingIndex]
  const quoteLayout = useMemo(() => balanceQuoteLines(saying.text), [saying.text])

  useEffect(() => {
    QRCode.toDataURL(SITE_HOME, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#37332deb', light: '#00000000' },
    }).then(setQrDataUrl).catch(() => setNotice('二维码暂时未能生成，请稍后再试。'))
  }, [])

  const showNext = () => {
    setSayingIndex((current) => (current + 17) % sayings.length)
    setNotice('换了一句，也不必急着读懂。')
  }

  const renderCard = async () => {
    if (!qrDataUrl) throw new Error('二维码尚未准备好')
    await document.fonts?.ready

    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1440
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法生成图片')

    context.fillStyle = '#f8f6f1'
    context.fillRect(0, 0, canvas.width, canvas.height)

    try {
      const background = await loadImage(mistLake)
      drawImageCover(context, background, canvas.width, canvas.height)
      context.fillStyle = 'rgba(250, 248, 243, .76)'
      context.fillRect(0, 0, canvas.width, canvas.height)
    } catch {
      // The restrained solid background remains usable if the image cannot load.
    }

    context.strokeStyle = 'rgba(157, 110, 52, .42)'
    context.lineWidth = 2
    context.strokeRect(52, 52, 976, 1336)

    try {
      const logo = await loadImage(kuanxinLogo)
      context.drawImage(logo, 40, 170, 560, 280, 78, 68, 244, 122)
    } catch {
      context.fillStyle = '#292722'
      context.textAlign = 'left'
      context.font = '500 44px "Noto Serif SC", "Songti SC", serif'
      context.fillText('宽心纪', 82, 138)
    }

    context.textAlign = 'right'
    context.fillStyle = '#35322d'
    context.font = '500 31px "Noto Serif SC", "Songti SC", serif'
    context.fillText(today.displayDate, 972, 116)
    context.fillStyle = '#70695f'
    context.font = '24px "Noto Serif SC", "Songti SC", serif'
    context.fillText(today.traditionalDate, 972, 158)

    context.textAlign = 'center'
    context.fillStyle = '#a66b2b'
    context.font = '400 35px STKaiti, "Kaiti SC", KaiTi, serif'
    context.fillText('上师一言', 540, 330)
    context.fillRect(500, 356, 80, 2)

    let quoteSize = quoteLayout.scale.canvas
    const quoteLines = quoteLayout.lines
    while (quoteSize > 36) {
      context.font = `400 ${quoteSize}px STKaiti, "Kaiti SC", KaiTi, serif`
      const widestLine = Math.max(...quoteLines.map((line) => context.measureText(line).width))
      if (widestLine <= 720) break
      quoteSize -= 2
    }

    const lineHeight = quoteSize * 1.72
    const quoteHeight = (quoteLines.length - 1) * lineHeight
    const quoteStartY = 700 - quoteHeight / 2
    context.fillStyle = '#292722'
    context.textAlign = 'center'
    quoteLines.forEach((line, index) => context.fillText(line, 540, quoteStartY + index * lineHeight))

    const qrImage = await loadImage(qrDataUrl)
    context.globalAlpha = .92
    context.drawImage(qrImage, 82, 1150, 158, 158)
    context.globalAlpha = 1

    context.textAlign = 'left'
    context.fillStyle = '#766c5e'
    context.font = '23px "Noto Serif SC", "Songti SC", serif'
    context.fillText('扫码进入', 278, 1199)
    context.fillStyle = '#39352f'
    context.font = '500 32px "Noto Serif SC", "Songti SC", serif'
    context.fillText('宽心的答案之书', 278, 1246)

    return canvas
  }

  const saveCard = async () => {
    setWorking(true)
    try {
      const canvas = await renderCard()
      const blob = await canvasToBlob(canvas)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `宽心纪-上师一言-${today.dateKey}-${saying.id}.png`
      link.href = objectUrl
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setNotice('图片已经生成，可以保存或转发给有缘的人。')
    } catch (error) {
      setNotice(error.message || '图片暂时未能生成，请稍后再试。')
    } finally {
      setWorking(false)
    }
  }

  const shareCard = async () => {
    setWorking(true)
    try {
      const canvas = await renderCard()
      const blob = await canvasToBlob(canvas)
      const file = new File([blob], `宽心纪-上师一言-${today.dateKey}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '宽心纪｜上师一言' })
      } else if (navigator.share) {
        await navigator.share({ title: '宽心纪｜上师一言', text: saying.text, url: SITE_HOME })
      } else {
        await navigator.clipboard.writeText(`${saying.text}\n${SITE_HOME}`)
        setNotice('语录和入口已经复制，可以粘贴分享。')
        return
      }
      setNotice('分享内容已经准备好。')
    } catch (error) {
      if (error?.name !== 'AbortError') setNotice(error.message || '暂时无法分享，请先保存图片。')
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="saying-screen" data-view="sayings" style={{ '--mist-image': `url(${mistLake})` }}>
      <header className="saying-header">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> 内容</button>
        <span>每日宽心</span>
      </header>

      <div className="saying-layout">
        <article className="saying-card" aria-labelledby="saying-heading">
          <div className="saying-card__topline">
            <img src={kuanxinLogo} alt="宽心纪" />
            <div className="saying-card__date">
              <time dateTime={today.dateKey}>{today.displayDate}</time>
              <span>{today.traditionalDate}</span>
            </div>
          </div>

          <div className="saying-card__body">
            <p>上师一言</p>
            <h1
              key={saying.id}
              id="saying-heading"
              data-route-heading
              tabIndex="-1"
              aria-label={quoteLayout.text}
              style={{
                '--quote-min': `${quoteLayout.scale.min}px`,
                '--quote-max': `${quoteLayout.scale.max}px`,
                '--quote-fluid': `${quoteLayout.scale.fluid}vw`,
                '--quote-fit': `${quoteLayout.fit}cqi`,
              }}
            >
              {quoteLayout.lines.map((line, index) => (
                <span
                  key={`${line}-${index}`}
                  className={EDGE_PUNCTUATION.has(Array.from(line).at(-1)) ? 'saying-card__line--punctuated' : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div className="saying-card__footer">
            {qrDataUrl ? <img src={qrDataUrl} alt="二维码：扫码进入宽心的答案之书" /> : <span className="saying-card__qr-loading" aria-hidden="true" />}
            <div><span>扫码进入</span><strong>宽心的答案之书</strong></div>
          </div>
        </article>

        <div className="saying-actions" aria-label="语录卡片操作">
          <button type="button" onClick={showNext} disabled={working}><ArrowClockwise size={18} /> 再读一句</button>
          <button type="button" onClick={saveCard} disabled={working || !qrDataUrl}><DownloadSimple size={18} /> 保存图片</button>
          <button type="button" onClick={shareCard} disabled={working || !qrDataUrl}><ShareNetwork size={18} /> 分享</button>
        </div>
        <p className="saying-notice" aria-live="polite">{working ? '正在生成卡片…' : notice}</p>
      </div>
    </section>
  )
}
