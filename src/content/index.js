import articleCatalog from './article-catalog.generated.json'

const articleModules = import.meta.glob('./articles/*.json')

export const articles = articleCatalog.sort((a, b) => a.order - b.order)

export async function loadArticle(articleId) {
  const loader = articleModules[`./articles/${articleId}.json`]
  if (!loader) throw new Error(`找不到文章：${articleId}`)
  const module = await loader()
  return module.default
}

const SEARCH_RESULT_LIMIT = 4

function describeMatch(article, query) {
  const matchedConcern = article.userConcerns.find((concern) => query.includes(concern.toLowerCase()) || concern.toLowerCase().includes(query))
  if (matchedConcern) return `回应了“${matchedConcern}”`

  const matchedKeyword = article.keywords.find((keyword) => query.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(query))
  if (matchedKeyword) return `与你提到的“${matchedKeyword}”有关`

  const matchedTheme = article.themes.find((theme) => query.includes(theme.toLowerCase()))
  if (matchedTheme) return `从“${matchedTheme}”的角度梳理`

  return `从“${article.theme}”的角度陪你看看`
}

export function rankArticles(question) {
  const query = question.trim().toLowerCase()
  if (!query) {
    const items = articles.slice(0, SEARCH_RESULT_LIMIT)
    return {
      items,
      reasons: Object.fromEntries(items.map((article) => [article.id, `从“${article.theme}”的角度陪你看看`])),
      hasCloseMatch: false,
    }
  }

  const ranked = articles
    .map((article) => {
      let score = 0
      const fields = [
        [article.title, 5],
        [article.quote, 4],
        [article.keywords.join(' '), 4],
        [article.userConcerns.join(' '), 3],
        [article.themes.join(' '), 2],
      ]

      fields.forEach(([text, weight]) => {
        if (text.toLowerCase().includes(query)) score += weight * 3
      })

      article.keywords.forEach((keyword) => {
        const normalizedKeyword = keyword.toLowerCase()
        if (query.includes(normalizedKeyword) || normalizedKeyword.includes(query)) {
          score += 8
          if (article.title.toLowerCase().includes(normalizedKeyword)) score += 6
          if (article.quote.toLowerCase().includes(normalizedKeyword)) score += 2
        }
      })
      article.userConcerns.forEach((concern) => {
        if (query.includes(concern) || concern.includes(query)) score += 5
      })
      article.themes.forEach((theme) => {
        if (query.includes(theme.toLowerCase())) score += 4
      })

      return { article, score }
    })
    .sort((a, b) => b.score - a.score || a.article.order - b.article.order)

  const items = ranked.slice(0, SEARCH_RESULT_LIMIT).map(({ article }) => article)

  return {
    items,
    reasons: Object.fromEntries(items.map((article) => [article.id, describeMatch(article, query)])),
    hasCloseMatch: ranked[0]?.score >= 8,
  }
}
