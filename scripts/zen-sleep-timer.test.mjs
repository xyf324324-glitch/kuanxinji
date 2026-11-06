import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
const source=readFileSync(new URL('../design/zen/app.js',import.meta.url),'utf8')
const helpers=source.slice(source.indexOf('function sleepTimerDue('),source.indexOf("$$('[data-sleep-close]').forEach(b=>b.onclick"))
const tick=source.slice(source.indexOf('function tick()'),source.indexOf('setInterval(tick'))
function setup(){const nodes=new Map();const buttons=Array.from({length:2},()=>({setAttribute(k,v){this[k]=v}}));const s={active:false,sleepClose:true,minutes:10,limitSeconds:600,started:1000,now:601000,timerHidden:false,enabled:true,ended:0,saved:0,$:selector=>{if(!nodes.has(selector))nodes.set(selector,{});return nodes.get(selector)},$$:()=>buttons,end(){s.active=false;s.ended++},savePrefs(){s.saved++},notice(){},Date:{now:()=>s.now},buttons};vm.createContext(s);vm.runInContext(helpers+tick,s);return s;}
test('preselecting sleep timer does not start it before meditation',()=>{const s=setup();assert.equal(s.sleepTimerDue(),false);s.tick();assert.equal(s.ended,0)})
test('selected timer stops once its original session duration has elapsed',()=>{const s=setup();s.active=true;s.now=600999;assert.equal(s.sleepTimerDue(),false);s.now=601000;s.tick();assert.equal(s.ended,1);assert.equal(s.enabled,false);assert.equal(s.saved,1)})
test('unchecked duration does not stop the music at the target time',()=>{const s=setup();s.active=true;s.sleepClose=false;s.tick();assert.equal(s.ended,0);assert.equal(s.enabled,true);assert.equal(s.$('#timer').textContent,'00:00')})
test('turning timer on partway through uses existing session deadline',()=>{const s=setup();s.active=true;s.now=301000;assert.equal(s.sleepTimerDue(),false);s.now=601000;assert.equal(s.sleepTimerDue(),true)})
test('both entry and settings button reflect the same selected state',()=>{const s=setup();s.syncSleepControls();assert.ok(s.buttons.every(b=>b['aria-pressed']==='true'&&!b.disabled));s.sleepClose=false;s.syncSleepControls();assert.ok(s.buttons.every(b=>b['aria-pressed']==='false'))})
test('unlimited duration disables both timer controls and cannot expire',()=>{const s=setup();s.minutes=0;s.limitSeconds=0;s.syncSleepControls();assert.ok(s.buttons.every(b=>b.disabled&&b['aria-pressed']==='false'));s.active=true;assert.equal(s.sleepTimerDue(),false)})
test('adding session time extends timer deadline',()=>{const s=setup();s.active=true;s.limitSeconds+=600;assert.equal(s.sleepTimerDue(),false);s.now=1201000;assert.equal(s.sleepTimerDue(),true)})
