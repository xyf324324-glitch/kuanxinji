import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

mkdirSync(join(root, 'dist', 'server'), { recursive: true })
mkdirSync(join(root, 'dist', '.openai'), { recursive: true })
copyFileSync(join(root, '.openai', 'hosting.json'), join(root, 'dist', '.openai', 'hosting.json'))

writeFileSync(
  join(root, 'dist', 'server', 'index.js'),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request)
  },
}
`,
  'utf8',
)
