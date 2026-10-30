import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'

// Publish the approved local page without sharing styles with the React app.
const source = new URL('../design/gongguoge/', import.meta.url)
const target = new URL('../public/gongguoge/', import.meta.url)
const fragment = (await readFile(new URL('page.fragment.html', source), 'utf8'))
  .split('<script>')[0]
  .replace('--wall-cloud:none', '--wall-cloud:url("./cloud.jpg")')
  .replace('--wall-sea:none', '--wall-sea:url("./sea.jpg")')
  .replace('__BRAND__', './brand.png')
const css = await readFile(new URL('refinement.css', source), 'utf8')
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#355447"><title>功过格 · 宽心纪</title>
<style>html{background:#536768;scroll-padding-bottom:120px}body{margin:0;min-width:280px}button,textarea{font:inherit}*{box-sizing:border-box}</style>
</head><body>${fragment}<style>${css}</style><script src="./icons.js"></script><script>lucide.createIcons({attrs:{width:20,height:20}})</script><script src="./page.js"></script></body></html>`
await mkdir(target, { recursive: true })
await writeFile(new URL('index.html', target), html)
for (const asset of ['page.js', 'icons.js', 'brand.png', 'meditation.svg', 'sea.jpg', 'cloud.jpg']) {
  await copyFile(new URL(asset, source), new URL(asset, target))
}
console.log('Prepared /gongguoge/ from the approved local page.')
