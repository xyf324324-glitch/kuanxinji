import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
let C;vm.runInNewContext(fs.readFileSync(new URL('../src/companion-video/companion.js',import.meta.url),'utf8'),{HTMLElement:class{},Math,performance,customElements:{get:()=>null,define:(n,c)=>C=c},document:{hidden:false,querySelector:()=>null,querySelectorAll:()=>[],body:{append(){}},createElement:()=>({})}});
let a=new C;const sequence=['salute','quiet','read','quiet','breath','sit','quiet'];
for(let i=0;i<3;i++)assert.deepEqual(sequence.map(()=>a.choose()),sequence);
assert.equal(a.choose(),'stand');assert.equal(a.choose(),'salute');
const clip=()=>({pause(){},play:()=>Promise.resolve(),currentTime:0});
a=new C;const exit=clip();Object.assign(a,{state:'meditate',loopsDone:0,video:clip(),pool:{'meditate-exit':exit},finishRequest(){},play(s){this.state=s}});
for(let i=0;i<8;i++)a.ended();assert.notEqual(a.video,exit);a.ended();assert.equal(a.video,exit);assert.equal(a.state,'meditate');a.ended();assert.equal(a.state,'rise');
for(const previous of ['salute','rise','read']){a=new C;Object.assign(a,{state:previous,pool:{quiet:clip(),'quiet-salute':clip(),'quiet-rise':clip()},subtitle:{textContent:''},canvas:{setAttribute(){}},maybeCaption(){}});a.play('quiet');assert.equal(a.video,a.pool[previous==='read'?'quiet':'quiet-'+previous]);}
a=new C;Object.assign(a,{state:'meditate',requested:true,video:clip(),pool:{'meditate-exit':exit},finishRequest(){this.requested=false}});a.tryRequested();assert.equal(a.video,exit);exit.currentTime=.75;a.startSeatedExit();assert.equal(exit.currentTime,.75);
console.log('PASS: cycle order; 18s seated + 2s exit; pose-specific quiet clips; manual exit does not restart transition.');

a=new C;Object.assign(a,{state:'meditate',subtitleActive:true,loopsDone:0,video:clip(),pool:{'meditate-exit':clip()},finishRequest(){},play(s){this.state=s}});for(let i=0;i<9;i++)a.ended();assert.equal(a.video,a.pool['meditate-exit']);console.log('PASS: subtitles do not extend seated duration');
