const {chromium}=require('C:/Users/yifan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.argv[2]||'http://127.0.0.1:4191/gongguoge/');await page.waitForSelector('.day');
await page.screenshot({path:path.join(__dirname,'mobile-390.png'),fullPage:true});
assert.equal(await page.locator('.field label').allTextContents().then(a=>a.join('|')),'今日之善|今日之省|明日一行');
assert.equal(await page.locator('textarea').first().inputValue(),'');
await page.locator('.site-menu-trigger').click();assert.match(await page.locator('.menu-panel').innerText(),/从此刻，慢慢走/);await page.keyboard.press('Escape');await page.locator('.month-toggle').click();assert.equal(await page.locator('.month').isVisible(),true);await page.locator('.month-toggle').click();
await page.evaluate(()=>localStorage.setItem('kuanxin-gongguoge-records-v1',JSON.stringify({'2026-09-27':{good:'历史善行',loss:'历史反省',next:'历史行动'}})));await page.reload();
await page.locator('#drop-good').fill('只记这一念，也可以保存。');await page.locator('.save').click();assert.match(await page.locator('.save-state').innerText(),/已保存至本机/);
const savedDate=await page.locator('.day.selected').getAttribute('data-date');await page.reload();assert.equal(await page.locator('#drop-good').inputValue(),'只记这一念，也可以保存。');
await page.locator('.month-toggle').click();await page.locator('[data-action="prev-month"]').click();await page.locator('.month-grid [data-date="2026-09-27"]').click();assert.equal(await page.locator('#drop-loss').inputValue(),'历史反省');
await page.locator('#drop-loss').fill('未点保存的草稿也不丢。');await page.reload();assert.equal(await page.locator('#drop-loss').inputValue(),'未点保存的草稿也不丢。');assert.match(await page.locator('.save-state').innerText(),/已恢复/);
await page.locator('[data-action="today"]').click();assert.equal(await page.locator('.day.selected').getAttribute('data-date'),savedDate);assert.equal(await page.locator('#drop-good').inputValue(),'只记这一念，也可以保存。');
await page.locator('#drop-next').fill(('较长的自省文字，保持自然换行。\n').repeat(18).slice(0,399));const dimensions=await page.locator('#drop-next').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,resize:getComputedStyle(e).resize}));assert.ok(dimensions.height<=320);assert.equal(dimensions.resize,'none');
await page.locator('#drop-next').focus();await page.setViewportSize({width:390,height:430});await page.waitForTimeout(350);const bounds=await page.locator('#drop-next').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=431,JSON.stringify(bounds));
for(const width of [320,390,430]){await page.setViewportSize({width,height:844});await page.waitForTimeout(80);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.save').dispatchEvent('pointerdown',{button:0,pointerId:1});assert.equal(await page.locator('.save').evaluate(e=>e.getAnimations().length),0);
await page.locator('#drop-good').fill('保留现场');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')}});await page.locator('#drop-good').fill('存储失败也不丢现场');await page.locator('.save').click();assert.match(await page.locator('.save-state').innerText(),/保存失败/);assert.equal(await page.locator('#drop-good').inputValue(),'存储失败也不丢现场');
assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:['390×844与320/430宽度','单栏保存与刷新恢复','旧字段及跨月历史读取','草稿刷新恢复','长文本框内滚动','缩小视口后的输入可见','存储失败真实反馈','减少动态效果'],errors},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
