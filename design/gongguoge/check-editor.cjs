const {chromium}=require('C:/Users/yifan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.argv[2]||'http://127.0.0.1:4191/gongguoge/');
 const measure=()=>page.evaluate(()=>({page:document.documentElement.scrollHeight,card:document.querySelector('.journal').getBoundingClientRect().height,field:document.querySelector('#drop-good').getBoundingClientRect().height}));
 const before=await measure();const long=('回看今天发生的事，给明天留一个小小行动。\n').repeat(18).slice(0,399);await page.locator('#drop-good').fill(long);assert.deepEqual(await measure(),before);
 assert.ok(await page.locator('#drop-good').evaluate(el=>el.scrollHeight>el.clientHeight));
 await page.locator('[data-editor="good"]').click();assert.equal(await page.locator('#expanded-text').inputValue(),long);assert.equal(await page.evaluate(()=>document.activeElement.id),'expanded-text');
 await page.screenshot({path:path.join(__dirname,'expanded-editor-390.png')});
 await page.locator('#expanded-text').fill('把整段文字精简成一句。');assert.equal(await page.locator('#drop-good').inputValue(),'把整段文字精简成一句。');assert.match(await page.locator('.editor-status').innerText(),/草稿已保留/);
 await page.setViewportSize({width:390,height:430});await page.waitForTimeout(100);const modal=await page.locator('.editor-dialog').boundingBox();assert.ok(modal.y>=0&&modal.y+modal.height<=431,JSON.stringify(modal));assert.ok(await page.locator('#expanded-text').evaluate(e=>e.clientHeight>100));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.locator('.editor-done').click();assert.equal(await page.locator('.editor-dialog').isVisible(),false);assert.deepEqual(await measure(),before);
 await page.locator('[data-editor="good"]').click();assert.equal(await page.locator('#expanded-text').inputValue(),'把整段文字精简成一句。');await page.keyboard.press('Escape');assert.equal(await page.locator('.editor-dialog').isVisible(),false);
 await page.reload();assert.equal(await page.locator('#drop-good').inputValue(),'把整段文字精简成一句。');await page.locator('.save').click();assert.match(await page.locator('.save-state').innerText(),/已保存/);
 await page.setViewportSize({width:320,height:844});await page.locator('[data-editor="next"]').click();assert.ok(await page.locator('.editor-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({before,after:await measure(),checks:['长文输入不改变卡片和页面高度','框内滚动','展开编辑内容一致','删减即时同步与草稿恢复','完成和Escape返回','缩小视口自适配','320宽度'],errors},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
