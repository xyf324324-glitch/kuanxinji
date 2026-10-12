
const ROOT='/teacher-companion/v11/';
const names={stand:'安静陪伴与问好',quiet:'安静站立',read:'读一会儿书',sit:'慢慢坐下',meditate:'静坐一会儿',rise:'自然起身',salute:'合掌问候',breath:'一念回光'};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class TeacherVideo extends HTMLElement{
 connectedCallback(){
 if(this.started)return;this.started=true;this.meditationTap=0;this.pending=null;this.state='stand';this.deadline=0;this.drag=null;this.pointers=new Map();this.scale=1;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 this.root=this.attachShadow({mode:'open'});
 this.root.innerHTML='<style>:host{position:fixed;z-index:9990;left:0;top:0;display:block;width:var(--actor-width,160px);height:var(--actor-height,284px);pointer-events:none;font-family:system-ui}canvas{width:100%;height:100%;display:block;pointer-events:auto;touch-action:none;cursor:grab;outline:none;background:transparent!important;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}canvas:focus-visible{outline:2px solid #b89664;border-radius:20px}.subtitle{position:absolute;pointer-events:none;width:188px;max-width:calc(100vw - 24px);text-align:center;font-family:Georgia,\'Songti SC\',\'SimSun\',serif;font-size:12px;line-height:1.65;letter-spacing:.035em;color:#6b5638;text-shadow:0 1px 3px #fffdf5,0 0 8px #fffdf5;opacity:0;white-space:normal;overflow-wrap:anywhere}.next{position:absolute;top:100%;margin-top:4px;left:50%;transform:translateX(-50%);pointer-events:auto;border:1px solid #ddd2bd;border-radius:16px;background:#fffdf5d9;color:#766348;font-size:11px;padding:4px 10px;white-space:nowrap;cursor:pointer}.next[hidden],.hide[hidden],.edge-hint[hidden]{display:none}.edge-hint{position:absolute;top:45%;left:0;right:0;text-align:center;color:#766348;font:12px "Songti SC","SimSun",serif;white-space:nowrap;background:#fffdf5e8;border-radius:12px;padding:6px 0}.next:disabled{opacity:.65;cursor:default}.hide{position:absolute;right:-28px;top:8px;pointer-events:auto;border:1px solid #dfd3bb;border-radius:50%;background:#fffdf5dc;color:#84745e;width:32px;height:32px;-webkit-tap-highlight-color:transparent;cursor:pointer}</style><canvas width="288" height="512" tabindex="0" role="button" aria-label="老师小人，点击展开动作按钮，拖动调整位置"></canvas><div class="subtitle" role="status" aria-live="polite" aria-atomic="true"></div><button class="next" hidden aria-label="当前动作完成后切换">换个动作</button><button class="hide" hidden aria-label="暂时收起人物">×</button><div class="edge-hint" hidden>松手收起</div>';
 this.canvas=this.root.querySelector('canvas');this.ctx=this.canvas.getContext('2d',{alpha:true});this.subtitle=this.root.querySelector('.subtitle');
 this.scratch=document.createElement('canvas');this.scratch.width=576;this.scratch.height=512;this.sc=this.scratch.getContext('2d',{willReadFrequently:true});this.pixels=this.ctx.createImageData(288,512);
 this.pool={};
 for(const state of ['stand','quiet','read','sit','meditate','rise','salute','breath','quiet-salute','quiet-rise','meditate-exit']){
 const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=ROOT+'media/'+state+'.mp4?v=11';
 video.addEventListener('ended',()=>{if(this.video===video)this.ended()});
 video.addEventListener('error',()=>this.canvas.setAttribute('aria-label','动画加载失败，请刷新重试'));
 video.addEventListener('loadeddata',()=>{if(this.video===video){this.draw();if(this.reduced&&!this.userPlay)video.pause()}});
 video.addEventListener('timeupdate',()=>{if(this.video===video){this.maybeCaption();this.tryRequested()}});
 if('requestVideoFrameCallback'in video){
 const frame=()=>{if(this.video===video)this.draw();video.requestVideoFrameCallback(frame)};video.requestVideoFrameCallback(frame);
 }
 this.pool[state]=video;video.load();
 }
 this.video=this.pool.stand;
 let saved;try{saved=JSON.parse(localStorage.getItem('teacher-video-position'))}catch{}
 this.userPlaced=!!saved&&(saved.userPlaced!==false);this.scale=clamp(Number(saved?.scale)||1,.65,2.2);this.size();
 this.lut=Array.from({length:256},(_,v)=>clamp(Math.round((255*Math.pow(v/255,.88)-128)*.96+132),0,255));
 this.x=saved?saved.x*(innerWidth-this.offsetWidth):innerWidth-this.offsetWidth-18;this.y=saved?saved.y*(innerHeight-this.offsetHeight):innerHeight-this.offsetHeight-36;this.place();this.installAvoidance();
 this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',e=>this.up(e,true));
 this.canvas.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();this.interact()}else if(e.key.startsWith('Arrow')){e.preventDefault();this.x+=e.key==='ArrowRight'?14:e.key==='ArrowLeft'?-14:0;this.y+=e.key==='ArrowDown'?14:e.key==='ArrowUp'?-14:0;this.userPlaced=true;this.place();this.save()}});
 this.nextButton=this.root.querySelector('.next');this.nextButton.onclick=()=>this.requestNext();
 this.closeButton=this.root.querySelector('.hide');this.edgeHint=this.root.querySelector('.edge-hint');this.closeButton.onclick=()=>this.hide();addEventListener('resize',()=>{this.size();if(this.userPlaced)this.place();else this.park()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){this.hiddenAt=performance.now();this.video.pause();this.subtitleAnimation?.pause()}else{if(!this.contextBlocked&&this.style.display!=='none')this.subtitleAnimation?.play();this.deadline+=performance.now()-(this.hiddenAt||performance.now());if(!this.reduced&&!this.contextBlocked&&this.style.display!=='none')this.video.play().catch(()=>{});this.last=performance.now()}});
 this.play('stand');
 const tick=()=>{if(!('requestVideoFrameCallback'in this.video)&&!this.video.paused)this.draw();requestAnimationFrame(tick)};requestAnimationFrame(tick);
 }
 draw(){
 if(this.video.readyState<2)return;
 this.sc.drawImage(this.video,0,0,576,512);const d=this.sc.getImageData(0,0,576,512).data,o=this.pixels.data;
 for(let y=0;y<512;y++)for(let x=0;x<288;x++){let s=(y*576+x)*4,t=(y*288+x)*4,a=(y*576+x+288)*4;o[t]=Math.min(255,this.lut[d[s]]+2);o[t+1]=this.lut[d[s+1]];o[t+2]=Math.max(0,this.lut[d[s+2]]-2);o[t+3]=d[a]<8?0:d[a]>248?255:d[a]}
 this.ctx.putImageData(this.pixels,0,0);
 this.footBottom=490;this.headTop=512;for(let y=0;y<512;y+=2){let found=false;for(let x=0;x<288;x+=2)if(o[(y*288+x)*4+3]>180){found=true;break}if(found){this.headTop=y;break}}this.positionSubtitle();
 }
 play(state){
 const previous=this.state;
 const keepCaption=previous==='sit'&&state==='meditate';
 this.video?.pause();
 if(!keepCaption){this.subtitleAnimation?.cancel();this.subtitleActive=false;this.captionShown=false;this.captionQueue=[];this.subtitle.textContent='';}
 this.state=state;if(!keepCaption)this.captionHead=null;this.video=this.pool[state==='quiet'&&['salute','rise'].includes(previous)?'quiet-'+previous:state];this.video.currentTime=0;
 this.video.playbackRate=state==='sit'?2.5:1;
 this.loopsDone=0;this.deadline=performance.now()+({read:10000,quiet:10000,meditate:20000}[state]||0);
 this.canvas.setAttribute('aria-label',names[state]+'；点击展开动作按钮，单指拖动，双指缩放');
 if((!this.reduced||this.userPlay)&&!this.contextBlocked)this.video.play().catch(()=>{});
 else if(this.video.readyState>=2)this.draw();
 this.maybeCaption();
 }
 maybeCaption(){
 if(this.captionShown)return;
 if(this.state==='sit'&&this.video.currentTime<(Number.isFinite(this.video.duration)?this.video.duration*.5:5))return;
 if(this.requested)return;
 this.captionShown=true;
 const lines={stand:['今天也要记得念南无阿弥陀佛~'],read:['认知见地真的很重要~'],sit:['人能常清静，天地悉皆归','您今天清净了吗？'],meditate:['您今天清净了吗？'],salute:['愿您心安','愿您自在'],breath:['常做一念回光']};
 this.captionQueue=[...(lines[this.state]||[])];
 if(this.captionQueue.length)this.showSubtitle(this.captionQueue.shift());this.tryRequested();
 }
 choose(){
 if(!this.actionQueue?.length){
 if(this.cycleStarted)this.completedCycles=(this.completedCycles||0)+1;
 this.cycleStarted=true;
 this.actionQueue=['salute','quiet','read','quiet','breath','sit','quiet'];
 if(this.completedCycles&&this.completedCycles%3===0)this.actionQueue.unshift('stand');
 }
 return this.actionQueue.shift();
 }
 interact(){
 this.setControls(this.nextButton.hidden);this.positionSubtitle();
 clearTimeout(this.buttonTimer);
 if(!this.nextButton.hidden)this.buttonTimer=setTimeout(()=>this.setControls(false),6500);
 if(this.video.paused&&!this.reduced&&!this.contextBlocked&&this.style.display!=='none')this.video.play().catch(()=>{});
 }
 setControls(visible){this.nextButton.hidden=!visible;if(this.closeButton)this.closeButton.hidden=!visible;}
 showSubtitle(text,{delay=0}={}){
 this.subtitleActive=true;this.subtitleAnimation?.cancel();this.subtitle.textContent=text;this.positionSubtitle();
 this.subtitleAnimation=this.subtitle.animate(this.reduced?
 [{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.85},{opacity:0}]:
 [{opacity:0,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)',offset:.12},{opacity:1,transform:'translateY(-1px)',offset:.72},{opacity:0,transform:'translateY(-3px)'}],
 {duration:this.state==='sit'?6500:this.state==='salute'?2400:5200,delay,easing:'ease-in-out',fill:'forwards'});
 this.subtitleAnimation.onfinish=()=>{this.subtitleActive=false;if(this.captionQueue.length)this.showSubtitle(this.captionQueue.shift(),{delay:this.state==='salute'?350:800});this.tryRequested()};
 }
 positionSubtitle(){
 if(!this.subtitle)return;const w=Math.min(188,innerWidth-24);
 this.subtitle.style.width=w+'px';
 const left=clamp(this.offsetWidth/2-w/2,12-this.x,innerWidth-12-this.x-w);
 const height=this.subtitle.offsetHeight||20;
 const target=this.headTop||(this.state==='meditate'?250:65);
 if(this.captionHead==null)this.captionHead=target;
 if(this.state==='sit'||this.state==='rise')this.captionHead+=(target-this.captionHead)*.18;
 else if(Math.abs(target-this.captionHead)>10)this.captionHead=target;
 const top=Math.max(8-this.y,this.captionHead/512*this.offsetHeight-height-5);
 this.subtitle.style.left=left+'px';this.subtitle.style.top=top+'px';
 if(this.closeButton){this.closeButton.style.right=Math.max(-28,this.x+this.offsetWidth+8-innerWidth)+'px';this.closeButton.style.top=Math.max(0,(this.headTop||65)/512*this.offsetHeight-28)+'px';}
 if(this.nextButton){const feet=(this.footBottom||490)/512*this.offsetHeight;
 this.nextButton.style.top=Math.min(feet+9,innerHeight-this.y-28)+'px';this.nextButton.style.marginTop='0';}
 }
 requestNext(){
 if(this.requested)return;
 this.requested=true;this.nextButton.hidden=false;this.nextButton.textContent='正在切换';this.nextButton.disabled=true;clearTimeout(this.buttonTimer);
 this.captionQueue=[];
 const opacity=getComputedStyle(this.subtitle).opacity;
 this.subtitleAnimation?.cancel();
 this.subtitleActive=true;
 this.subtitleAnimation=this.subtitle.animate([{opacity},{opacity:0}],{duration:220,fill:'forwards'});
 this.subtitleAnimation.onfinish=()=>{this.subtitleActive=false;this.tryRequested()};
 if(this.reduced)this.userPlay=true;
 if(this.video.paused&&!this.video.ended)this.video.play().catch(()=>{});
 }
 tryRequested(){
 if(!this.requested||this.subtitleActive||document.hidden)return;
 const t=this.video.currentTime;
 // Only leave standing when the hand is down; reading waits for its clip boundary.
 if(this.state==='meditate'){this.finishRequest();this.startSeatedExit()}
 else if(this.state==='quiet'||(this.state==='stand'&&(t<5||t>10.1))){this.finishRequest();this.play(this.choose())}
 }
 startSeatedExit(){
 if(this.video===this.pool['meditate-exit'])return;
 this.video.pause();this.video=this.pool['meditate-exit'];this.video.currentTime=0;this.video.playbackRate=1;this.loopsDone=9;
 if(!this.contextBlocked&&!document.hidden)this.video.play().catch(()=>{});
 }
 finishRequest(){this.requested=false;if(this.nextButton){this.setControls(false);this.nextButton.textContent='换个动作';this.nextButton.disabled=false}}
 ended(){
 if(this.reduced&&!this.requested){this.userPlay=false;this.video.pause();return}
 if(this.state==='sit'){this.play('meditate');return}
 if(this.subtitleActive&&this.state!=='meditate'){this.video.currentTime=0;this.video.play().catch(()=>{});return}
 if(this.state==='meditate'){
 this.loopsDone=(this.loopsDone||0)+1;
 if(this.loopsDone===9){this.startSeatedExit();return}
 if(!this.requested&&this.loopsDone<10){this.video.currentTime=0;this.video.play().catch(()=>{});return}
 this.finishRequest();this.play('rise');return;
 }
 this.finishRequest();this.play(this.choose());
 }
 installAvoidance(){
 const update=()=>{clearTimeout(this.contextTimer);this.contextTimer=setTimeout(()=>this.syncContext(),80)};
 document.addEventListener('focusin',update);document.addEventListener('focusout',update);
 addEventListener('hashchange',()=>{update();if(!this.userPlaced)setTimeout(()=>this.park(),150)});
 this.contextObserver=new MutationObserver(update);
 const app=document.getElementById('root');
 if(app)this.contextObserver.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded','open','hidden']});
 this.syncContext();if(!this.userPlaced)this.park();
 }
 syncContext(){
 const active=document.activeElement;
 const editing=active?.matches('textarea,[contenteditable="true"],input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])');
 const menu=[...document.querySelectorAll('#site-menu,.menu-panel,[aria-modal="true"],dialog[open]')].some(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0);
 const blocked=!!(editing||menu);
 if(blocked===!!this.contextBlocked)return;
 this.contextBlocked=blocked;
 if(blocked){this.blockedAt=performance.now();this.style.visibility='hidden';this.video.pause();this.subtitleAnimation?.pause();if(this.restoreButton)this.restoreButton.hidden=true}
 else{this.deadline+=performance.now()-(this.blockedAt||performance.now());this.style.visibility='';if(this.restoreButton)this.restoreButton.hidden=false;
 if(this.style.display!=='none'&&!document.hidden){this.subtitleAnimation?.play();if(!this.reduced)this.video.play().catch(()=>{})}}
 }
 park(){
 if(this.userPlaced)return;
 const w=this.offsetWidth,h=this.offsetHeight;
 this.x=innerWidth-w-8;this.y=innerHeight-h-44;
 const body=document.querySelector('.article-body,.article-catalog');
 if(innerWidth>760&&body){const r=body.getBoundingClientRect();if(innerWidth-r.right>w+20)this.x=r.right+10;else if(r.left>w+20)this.x=r.left-w-10}
 // Keep the default character above fixed bottom navigation and visible action bars.
 for(const e of document.querySelectorAll('nav,footer,.article-footer,[role="toolbar"]')){
 const r=e.getBoundingClientRect(),pos=getComputedStyle(e).position;
 if((pos==='fixed'||pos==='sticky')&&r.height>0&&r.top>innerHeight*.65&&r.left<this.x+w&&r.right>this.x)this.y=Math.min(this.y,r.top-h-38);
 }
 this.place();
 }
 size(){
 this.baseWidth=innerWidth<=600?108:160;
 const max=Math.max(.3,Math.min(2.2,(innerWidth-12)/this.baseWidth,(innerHeight-12)/(this.baseWidth*512/288)));
 this.scale=clamp(this.scale,Math.min(.65,max),max);
 this.style.setProperty('--actor-width',this.baseWidth*this.scale+'px');
 this.style.setProperty('--actor-height',this.baseWidth*this.scale*512/288+'px');
 }
 down(e){
 if(e.button!==0)return;
 this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture(e.pointerId);
 if(this.pointers.size===1)this.drag={x:e.clientX,y:e.clientY,ox:this.x,oy:this.y,moved:false};
 if(this.pointers.size>=2){
 const [a,b]=[...this.pointers.values()];const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
 this.pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),scale:this.scale,u:(cx-this.x)/this.offsetWidth,v:(cy-this.y)/this.offsetHeight};
 this.drag=null;this.gesture=true;this.setControls(false);this.edgeHint.hidden=true;this.edgeDismiss=false;
 }
 }
 move(e){
 if(!this.pointers.has(e.pointerId))return;
 this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(this.pinch&&this.pointers.size>=2){
 const [a,b]=[...this.pointers.values()];this.scale=this.pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/this.pinch.distance;this.size();
 this.x=(a.x+b.x)/2-this.pinch.u*this.offsetWidth;this.y=(a.y+b.y)/2-this.pinch.v*this.offsetHeight;this.place();return;
 }
 if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
 if(Math.hypot(dx,dy)>6)this.drag.moved=true;
 if(this.drag.moved){this.setControls(false);this.x=this.drag.ox+dx;this.y=this.drag.oy+dy;this.place(!this.gesture);this.edgeDismiss=!this.gesture&&(this.x < -this.offsetWidth*.35||this.x > innerWidth-this.offsetWidth*.65);this.edgeHint.hidden=!this.edgeDismiss;}
 }
 up(e,cancelled=false){
 if(!this.pointers.has(e.pointerId))return;
 const moved=this.drag?.moved;this.pointers.delete(e.pointerId);
 if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
 if(this.pointers.size){this.pinch=null;const a=[...this.pointers.values()][0];this.drag={x:a.x,y:a.y,ox:this.x,oy:this.y,moved:true};return}
 if(!cancelled&&moved&&this.edgeDismiss){this.edgeDismiss=false;this.edgeHint.hidden=true;this.drag=null;this.pinch=null;this.gesture=false;this.place();this.hide();return;}
 this.edgeDismiss=false;this.edgeHint.hidden=true;this.place();
 if(!cancelled&&!this.gesture&&!moved)this.interact();
 if(moved||this.gesture){this.userPlaced=true;this.save()}this.drag=null;this.pinch=null;this.gesture=false;
 }
 place(allowEdge=false){this.x=clamp(this.x,allowEdge?-this.offsetWidth*.6:0,Math.max(0,innerWidth-this.offsetWidth)+(allowEdge?this.offsetWidth*.6:0));this.y=clamp(this.y,0,Math.max(0,innerHeight-this.offsetHeight-34));this.style.transform='none';this.style.left=Math.round(this.x)+'px';this.style.top=Math.round(this.y)+'px';this.positionSubtitle()}
 save(){try{localStorage.setItem('teacher-video-position',JSON.stringify({userPlaced:this.userPlaced,scale:this.scale,x:this.x/Math.max(1,innerWidth-this.offsetWidth),y:this.y/Math.max(1,innerHeight-this.offsetHeight)}))}catch{}}
 hide(){clearTimeout(this.buttonTimer);this.nextButton.hidden=true;this.finishRequest();this.subtitleActive=false;this.waitingEnd=false;this.subtitleAnimation?.cancel();this.subtitle.textContent='';this.pending=null;this.video.pause();this.style.display='none';const b=document.createElement('button');b.textContent='请老师回来';b.style.cssText='position:fixed;bottom:20px;right:18px;z-index:9991;border:1px solid #d3bf9e;border-radius:24px;background:#fffdf5;color:#69553b;padding:9px 15px;cursor:pointer;font-family:Georgia,"Songti SC","STSong","SimSun",serif;font-size:13px;font-weight:400;letter-spacing:.12em;line-height:1.6;-webkit-tap-highlight-color:transparent';this.restoreButton=b;b.hidden=!!this.contextBlocked;document.body.append(b);b.onclick=()=>{b.remove();this.restoreButton=null;this.style.display='block';this.play('stand')}}
}
if(!customElements.get('teacher-video-companion'))customElements.define('teacher-video-companion',TeacherVideo);
document.querySelectorAll('teacher-companion-3d,kuanxin-companion,teacher-companion').forEach(e=>e.remove());
if(!document.querySelector('teacher-video-companion'))document.body.append(document.createElement('teacher-video-companion'));
