from pathlib import Path

root=Path(__file__).parent
fragment=(root/'page.fragment.html').read_text(encoding='utf-8').split('<script>')[0]
(root/'page.fragment.html').write_text(fragment,encoding='utf-8')
fragment=fragment.replace('--wall-cloud:none','--wall-cloud:url("./cloud.jpg")').replace('--wall-sea:none','--wall-sea:url("./sea.jpg")')
fragment=fragment.replace('__BRAND__','./brand.png')
source=(root/'page.js').read_text(encoding='utf-8')
old="$('.month-toggle').textContent=(d.getMonth()+1)+'月'+d.getDate()+'日 ⌄';"
new="$('.month-toggle').setAttribute('aria-label','展开'+(d.getMonth()+1)+'月月历');$('.current-month').textContent=d.getFullYear()+'年'+(d.getMonth()+1)+'月';"
source=source.replace(old,new)
(root/'page.js').write_text(source,encoding='utf-8')
css=(root/'refinement.css').read_text(encoding='utf-8')
html='''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#355447"><title>功过格 · 宽心纪</title>
<style>html{background:#536768;scroll-padding-bottom:120px}body{margin:0;min-width:280px}button,textarea{font:inherit}*{box-sizing:border-box}</style>
</head><body>'''+fragment+'<style>'+css+'</style><script src="./icons.js"></script><script>lucide.createIcons({attrs:{width:20,height:20}})</script><script src="./page.js"></script></body></html>'
(root/'index.html').write_text(html,encoding='utf-8')
print('Built existing-page refinement:',root/'index.html')
