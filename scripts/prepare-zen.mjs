import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
const source = new URL('../design/zen/', import.meta.url)
const target = new URL('../public/zen/', import.meta.url)
await mkdir(target, { recursive: true })
for (const file of ['index.html', 'style.css', 'refinement.css', 'music-store.js', 'music-library.js', 'water.js', 'app.js']) {
  await cp(new URL(file, source), new URL(file, target))
}
await cp(new URL('assets/', source), new URL('assets/', target), { recursive: true })
// Only the standalone practice page's assets are copied. Masters and QA stay local.
const html = await readFile(new URL('index.html', target), 'utf8')
await writeFile(new URL('index.html', target), html.replace('data-src="/home.html"', 'data-src="/"'))
console.log('Prepared /zen/ with streaming music assets.')
