import articleCatalog from './article-catalog.generated.json'

const articleModules = import.meta.glob('./articles/*.json')

export const articles = articleCatalog.sort((a, b) => a.order - b.order)

export async function loadArticle(articleId) {
  const loader = articleModules[`./articles/${articleId}.json`]
  if (!loader) throw new Error(`找不到文章：${articleId}`)
  const module = await loader()
  return module.default
}

export function rankArticles(question) {
  const query = question.trim().toLowerCase()
  if (!query) return { items: articles, hasCloseMatch: false }

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
        if (query.includes(keyword) || keyword.includes(query)) score += 8
      })
      article.userConcerns.forEach((concern) => {
        if (query.includes(concern) || concern.includes(query)) score += 5
      })

      return { article, score }
    })
    .sort((a, b) => b.score - a.score || a.article.order - b.article.order)

  return {
    items: ranked.map(({ article }) => article),
    hasCloseMatch: ranked[0]?.score >= 8,
  }
}
