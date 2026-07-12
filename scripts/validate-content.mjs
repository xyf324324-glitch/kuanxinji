import { readdir, readFile } from 'node:fs/promises'

const root = new URL('../src/content/articles/', import.meta.url)
const requiredFields = [
  'id',
  'title',
  'quote',
  'theme',
  'themes',
  'keywords',
  'userConcerns',
  'paragraphs',
  'sourceStatus',
  'reviewStatus',
  'sourceUrl',
]

const files = (await readdir(root)).filter((file) => file.endsWith('.json'))
const ids = new Set()
const errors = []

for (const file of files) {
  const article = JSON.parse(await readFile(new URL(file, root), 'utf8'))
  requiredFields.forEach((field) => {
    if (!(field in article)) errors.push(`${file}: 缺少字段 ${field}`)
  })
  if (ids.has(article.id)) errors.push(`${file}: id ${article.id} 重复`)
  ids.add(article.id)
  if (!Array.isArray(article.paragraphs) || article.paragraphs.length === 0) errors.push(`${file}: paragraphs 不能为空`)
  if (!Array.isArray(article.keywords) || article.keywords.length === 0) errors.push(`${file}: keywords 不能为空`)
  if (!['prototype', 'published-source', 'authorized', 'public-domain'].includes(article.sourceStatus)) errors.push(`${file}: sourceStatus 不合法`)
  if (!['pending', 'approved', 'rejected'].includes(article.reviewStatus)) errors.push(`${file}: reviewStatus 不合法`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`内容检查通过：${files.length} 篇文章，未发现缺失字段或重复ID。`)
