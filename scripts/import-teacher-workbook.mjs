import ExcelJS from 'exceljs'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const workbookPath = process.argv[2]
if (!workbookPath) throw new Error('请在命令后提供 xlsx 文件路径')

const articleDirectory = fileURLToPath(new URL('../src/content/articles/', import.meta.url))
const reportDirectory = fileURLToPath(new URL('../reports/', import.meta.url))
const catalogUrl = new URL('../src/content/article-catalog.generated.json', import.meta.url)

let existingCatalog = []
try {
  existingCatalog = JSON.parse(await readFile(catalogUrl, 'utf8'))
} catch {
  // The first import has no catalog to preserve.
}

const existingIdByUrl = new Map(existingCatalog
  .filter((article) => article.sourceUrl)
  .map((article) => [article.sourceUrl, article.id]))
const existingTitleCounts = existingCatalog.reduce((counts, article) => {
  counts.set(article.title, (counts.get(article.title) || 0) + 1)
  return counts
}, new Map())
const existingIdByUniqueTitle = new Map(existingCatalog
  .filter((article) => existingTitleCounts.get(article.title) === 1)
  .map((article) => [article.title, article.id]))

const categoryRules = [
  { theme: '关系', words: ['关系', '前任', '婚姻', '伴侣', '爱人', '家人', '父母', '亲子', '孩子', '感情'] },
  { theme: '情绪', words: ['烦恼', '情绪', '焦虑', '恐惧', '痛苦', '内耗', '愤怒', '委屈', '纠缠', '执着'] },
  { theme: '因缘', words: ['因果', '因缘', '业力', '果子', '福报', '功德'] },
  { theme: '修行', words: ['修行', '禅宗', '佛法', '佛陀', '菩萨', '觉悟', '解脱', '本来面目', '空性', '明觉'] },
  { theme: '生活', words: ['生活', '工作', '财富', '身体', '健康', '成长', '选择', '品质'] },
]

const concernByTheme = {
  关系: ['关系变化', '家人相处', '放不下一段关系'],
  情绪: ['情绪反复', '内心烦恼', '焦虑与恐惧'],
  因缘: ['如何理解因果', '面对已经发生的事', '看见生命规律'],
  修行: ['修行迷茫', '如何回到当下', '认识生命本质'],
  生活: ['面对生活变化', '日常选择', '身心状态'],
  觉察: ['此刻的困惑', '自我觉察', '回到当下'],
}

function cellText(cell) {
  const value = cell.value
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('hyperlink' in value) return String(value.hyperlink || value.text || '')
    if ('richText' in value) return value.richText.map((part) => part.text).join('')
    if ('text' in value) return String(value.text || '')
    if ('result' in value) return String(value.result || '')
  }
  return String(value)
}

function normalizeText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\u00a0]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeUrl(value) {
  const url = value.trim()
  if (!url) return ''
  return url.replace(/^http:\/\/mp\.weixin\.qq\.com/i, 'https://mp.weixin.qq.com')
}

function splitLongParagraph(text, targetLength = 260) {
  if (text.length <= targetLength * 1.4) return [text]
  const sentences = text.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [text]
  const paragraphs = []
  let current = ''
  sentences.forEach((sentence) => {
    if (current && current.length + sentence.length > targetLength) {
      paragraphs.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  })
  if (current.trim()) paragraphs.push(current.trim())
  return paragraphs
}

function paragraphsFrom(body) {
  const withoutSignature = body.replace(/\s*[—-]{1,2}\s*赖宽心\s*$/u, '').trim()
  const blocks = withoutSignature
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item && !/^[—-]{1,2}\s*赖宽心$/u.test(item))
  return blocks.flatMap((block) => splitLongParagraph(block))
}

function quoteFrom(paragraphs) {
  const sentences = paragraphs.join('').match(/[^。！？!?；;]+[。！？!?；;]?/g) || []
  const selected = sentences.find((sentence) => sentence.trim().length >= 12 && sentence.trim().length <= 68)
    || sentences.find((sentence) => sentence.trim().length >= 8)
    || paragraphs[0]
  return selected.trim().slice(0, 90)
}

function classify(title, body) {
  const sample = `${title}\n${body}`
  const matches = categoryRules
    .map((rule) => ({
      ...rule,
      hits: rule.words.filter((word) => sample.includes(word)),
    }))
    .filter((rule) => rule.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length)

  const themes = matches.slice(0, 2).map((item) => item.theme)
  if (!themes.length) themes.push('觉察')
  const keywords = [...new Set(matches.flatMap((item) => item.hits).slice(0, 10))]
  if (!keywords.length) keywords.push(...themes)
  const userConcerns = [...new Set(themes.flatMap((theme) => concernByTheme[theme] || concernByTheme.觉察))]
  return { themes, keywords, userConcerns }
}

function stableId(title, url) {
  if (title.startsWith('烦恼是因为迷在念头里面了')) return 'still-mind'
  if (title.startsWith('一切的呈现都是成熟的果子')) return 'acceptance'
  if (title.includes('所有缘分') && title.includes('走一段路')) return 'relationship'
  const hash = createHash('sha1').update(url || title).digest('hex').slice(0, 12)
  return `lai-${hash}`
}

function articleId(title, sourceUrl) {
  return existingIdByUrl.get(sourceUrl)
    || existingIdByUniqueTitle.get(title)
    || stableId(title, `${sourceUrl}|${title}`)
}

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(workbookPath)
const sheet = workbook.worksheets[0]
if (!sheet) throw new Error('表格中没有工作表')

const articles = []
const skipped = []
const duplicateLinks = []
const duplicateTitles = []
const seenLinks = new Map()
const seenTitles = new Map()

for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
  const row = sheet.getRow(rowNumber)
  const sourceUrl = normalizeUrl(cellText(row.getCell(1)))
  const title = normalizeText(cellText(row.getCell(2)))
  const body = normalizeText(cellText(row.getCell(3)))

  if (!title || !body) {
    skipped.push({ rowNumber, reason: !title ? '缺少标题' : '缺少正文' })
    continue
  }
  const previousLink = sourceUrl ? seenLinks.get(sourceUrl) : null
  if (previousLink) {
    const exactDuplicate = previousLink.title === title && previousLink.body === body
    duplicateLinks.push({ rowNumber, firstRow: previousLink.rowNumber, sourceUrl, exactDuplicate })
    if (exactDuplicate) {
      skipped.push({ rowNumber, reason: `与第 ${previousLink.rowNumber} 行完全重复` })
      continue
    }
  }
  if (seenTitles.has(title)) duplicateTitles.push({ rowNumber, firstRow: seenTitles.get(title), title })
  if (sourceUrl) seenLinks.set(sourceUrl, { rowNumber, title, body })
  seenTitles.set(title, rowNumber)

  const paragraphs = paragraphsFrom(body)
  const { themes, keywords, userConcerns } = classify(title, body)
  articles.push({
    id: articleId(title, sourceUrl),
    order: articles.length + 1,
    title,
    quote: quoteFrom(paragraphs),
    theme: themes.join(' · '),
    themes,
    keywords,
    userConcerns,
    paragraphs,
    author: '赖宽心',
    sourceStatus: 'published-source',
    reviewStatus: 'pending',
    sourceUrl,
  })
}

await mkdir(articleDirectory, { recursive: true })
const currentFiles = (await readdir(articleDirectory)).filter((file) => file.endsWith('.json'))
for (const file of currentFiles) await rm(new URL(`../src/content/articles/${file}`, import.meta.url))

for (const article of articles) {
  await writeFile(
    new URL(`../src/content/articles/${article.id}.json`, import.meta.url),
    `${JSON.stringify(article, null, 2)}\n`,
    'utf8',
  )
}

const catalog = articles.map((article) => Object.fromEntries(
  Object.entries(article).filter(([key]) => key !== 'paragraphs'),
))
await writeFile(
  new URL('../src/content/article-catalog.generated.json', import.meta.url),
  `${JSON.stringify(catalog, null, 2)}\n`,
  'utf8',
)

await mkdir(reportDirectory, { recursive: true })
const paragraphCounts = articles.map((article) => article.paragraphs.length)
const report = {
  source: workbookPath,
  sheet: sheet.name,
  importedAt: new Date().toISOString(),
  imported: articles.length,
  skipped,
  duplicateLinks,
  duplicateTitles,
  missingLinks: articles.filter((article) => !article.sourceUrl).map((article) => article.id),
  paragraphStats: {
    min: Math.min(...paragraphCounts),
    max: Math.max(...paragraphCounts),
    average: Number((paragraphCounts.reduce((sum, value) => sum + value, 0) / paragraphCounts.length).toFixed(1)),
  },
  themeCounts: articles.reduce((counts, article) => {
    article.themes.forEach((theme) => { counts[theme] = (counts[theme] || 0) + 1 })
    return counts
  }, {}),
}

await writeFile(new URL('../reports/content-import-report.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(report, null, 2))
