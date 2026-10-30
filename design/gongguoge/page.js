
(()=>{
const root=document.getElementById('waterdrop-demo'),$=s=>root.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const dayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const parse=k=>{const p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])},key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const valid=k=>typeof k==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(k)&&key(parse(k))===k;
let today=dayKey(),selected=today,month=parse(today),themeMode='sea',dirty=false;
const records={};
const RECORD_KEY='kuanxin-gongguoge-records-v1',DRAFT_KEY='kuanxin-gongguoge-drafts-v1';
let storageProblem='',drafts={},storedRecords={};
function readStore(name){const raw=localStorage.getItem(name);if(raw===null)return {};const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('记录格式异常');for(const[k,r]of Object.entries(value)){if(!valid(k)||!r||!['good','loss','next'].every(f=>typeof r[f]==='string'))throw Error('记录格式异常');}return value;}
try{storedRecords=readStore(RECORD_KEY);drafts=readStore(DRAFT_KEY);Object.assign(records,storedRecords,drafts);}catch{storageProblem='无法读取本机记录，请先检查浏览器存储；现有数据不会被覆盖。';}
try{const lastDate=localStorage.getItem('kuanxin-gongguoge-selected-v1');if(valid(lastDate)){selected=lastDate;month=parse(lastDate);}}catch{ /* Storage availability is reported by the record reader. */ }
function notice(text,error=false){const el=$('.save-state');el.textContent=text;el.setAttribute('role',error?'alert':'status');}
function writeStore(name,value){if(storageProblem)throw Error(storageProblem);const serialized=JSON.stringify(value);localStorage.setItem(name,serialized);if(localStorage.getItem(name)!==serialized)throw Error('存储校验失败');}
function autosize(el){el.style.removeProperty('height');}
function keepDraft(){const value=draft();records[selected]=value;try{const next={...readStore(DRAFT_KEY),[selected]:value};writeStore(DRAFT_KEY,next);drafts=next;dirty=false;notice('草稿已保留在本机');}catch{dirty=true;notice('草稿暂未保存，请保留此页并复制内容。',true);}}
function saveRecord(){const r=draft();if(!Object.values(r).some(v=>v.trim())){notice('不必写满，先记下一念再保存。',true);return;}try{const next={...readStore(RECORD_KEY),[selected]:r};writeStore(RECORD_KEY,next);storedRecords=next;records[selected]=r;const pending=readStore(DRAFT_KEY);delete pending[selected];try{writeStore(DRAFT_KEY,pending);drafts=pending;}catch{ /* The durable record has already been verified. */ }dirty=false;notice('已保存至本机 · '+selected);persist();}catch{dirty=true;notice('保存失败，请检查浏览器存储或空间；内容仍留在此页。',true);}}
const dailyTheme=k=>{let n=2166136261;for(const c of 'kuanxin-daily-v2:'+k){n=Math.imul(n^c.charCodeAt(0),16777619)}return (n>>>8)&1?'cloud':'sea'};
function setTheme(){root.dataset.theme=themeMode==='auto'?dailyTheme(today):themeMode;root.querySelectorAll('[data-theme-pick]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themePick===themeMode)));}
function draft(){return{good:$('#drop-good').value,loss:$('#drop-loss').value,next:$('#drop-next').value}}
function stash(){if(dirty){keepDraft();if(dirty)return false;}return true;}
function loadFields(){const r=records[selected]||{};for(const k of ['good','loss','next']){const el=$('#drop-'+k);el.value=r[k]||'';autosize(el);}notice(storageProblem||(drafts[selected]?'已恢复未提交的本机草稿':''),Boolean(storageProblem));}
function persist(){try{localStorage.setItem('kuanxin-gongguoge-selected-v1',selected);}catch{ /* Never turn an optional UI preference into a record failure. */ }const entries=Object.entries(records).slice(-3);if(window.openai?.setWidgetState)window.openai.setWidgetState({modelContent:{design:'功过格手机水珠动效',theme:root.dataset.theme,themeMode},privateContent:{selected,themeMode,records:Object.fromEntries(entries)}}).catch(()=>{});}
const springs=new WeakMap();
function release(b,canceled=false){const a=springs.get(b);if(!a)return;const from=getComputedStyle(b).transform;a.cancel();springs.delete(b);b.classList.remove('pressing');if(reduced.matches){b.style.transform='';return}const bounce=b.animate([{transform:from},{transform:'scale(.94,1.10)',offset:.28},{transform:'scale(1.04,.96)',offset:.52},{transform:'scale(.99,1.02)',offset:.75},{transform:'scale(1)'}],{duration:canceled?320:650,easing:'cubic-bezier(.2,.7,.3,1)'});springs.set(b,bounce);bounce.onfinish=()=>{if(springs.get(b)===bounce)springs.delete(b)};}
function press(b,e){springs.get(b)?.cancel();if(reduced.matches)return;const r=b.getBoundingClientRect();b.style.setProperty('--touch-x',((e.clientX-r.left)/r.width*100||50)+'%');b.style.setProperty('--touch-y',((e.clientY-r.top)/r.height*100||50)+'%');b.classList.remove('pressing');void b.offsetWidth;b.classList.add('pressing');const a=b.animate([{transform:getComputedStyle(b).transform==='none'?'scale(1)':getComputedStyle(b).transform},{transform:b.classList.contains('save')?'scale(1.045,.80)':'scale(1.10,.79)'}],{duration:155,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});springs.set(b,a);}
function bindDrop(b){b.classList.add('droplet','cursor-interaction');b.addEventListener('pointerdown',e=>{if(e.button!==0)return;press(b,e);if(e.isTrusted)b.setPointerCapture?.(e.pointerId)});b.addEventListener('pointerup',()=>release(b));b.addEventListener('pointercancel',()=>release(b,true));b.addEventListener('lostpointercapture',()=>{if(b.classList.contains('pressing'))release(b,true)});b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)press(b,{clientX:0,clientY:0})});b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release(b)});b.addEventListener('blur',()=>{if(b.classList.contains('pressing'))release(b,true)});}
function renderWeek(){const start=parse(selected);start.setDate(start.getDate()-(start.getDay()+6)%7);const stamp=key(start),week=$('.week');if(week.dataset.start!==stamp){week.dataset.start=stamp;week.replaceChildren();for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const b=document.createElement('button');b.type='button';b.className='day';b.dataset.date=key(d);b.innerHTML='<small>周'+'日一二三四五六'[d.getDay()]+'</small><span>'+d.getDate()+'</span>';b.setAttribute('aria-label',(d.getMonth()+1)+'月'+d.getDate()+'日');bindDrop(b);week.appendChild(b)}}week.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.date===selected);b.setAttribute('aria-pressed',String(b.dataset.date===selected))});const d=parse(selected);$('.month-toggle').setAttribute('aria-label','展开'+(d.getMonth()+1)+'月月历');$('.current-month').textContent=d.getFullYear()+'年'+(d.getMonth()+1)+'月';}
function renderMonth(){const y=month.getFullYear(),m=month.getMonth();$('.month-head span').textContent=y+'年'+(m+1)+'月';const offset=(new Date(y,m,1).getDay()+6)%7,total=new Date(y,m+1,0).getDate();let html='';for(let i=0;i<offset;i++)html+='<span></span>';for(let i=1;i<=total;i++){const k=key(new Date(y,m,i));html+='<button type="button" class="cursor-interaction '+(k===selected?'selected':'')+'" data-date="'+k+'" aria-pressed="'+(k===selected)+'">'+i+'</button>'}$('.month-grid').innerHTML=html;}
function chooseDate(date){if(!stash())return;selected=date;renderWeek();loadFields();$('.month').hidden=true;$('.month-toggle').setAttribute('aria-expanded','false');persist();}
const editor=$('.editor-dialog'),expanded=$('#expanded-text');
let editingField=null,editorTrigger=null,editorScroll={x:0,y:0},previousOverflow='';
function fitExpandedEditor(){if(!editor.open)return;const viewport=window.visualViewport;editor.style.height=Math.min(720,Math.max(180,(viewport?.height||innerHeight)-24))+'px';editor.style.top=((viewport?.offsetTop||0)+12)+'px';}
function editorMeta(){const count=expanded.value.length;$('.editor-count').textContent=count+'/400';$('.editor-status').textContent=dirty?'草稿未保存，请先保留此页。':'草稿已保留 · 完成后可点保存今日';}
function openEditor(field,trigger){if(!['good','loss','next'].includes(field))return;editingField=field;editorTrigger=trigger;editorScroll={x:scrollX,y:scrollY};previousOverflow=document.documentElement.style.overflow;$('#editor-title').textContent=$('label[for="drop-'+field+'"]').textContent;$('#editor-guide').textContent=$('#'+field+'-guide').textContent;expanded.value=$('#drop-'+field).value;editor.showModal();document.documentElement.style.overflow='hidden';fitExpandedEditor();editorMeta();expanded.focus({preventScroll:true});}
$('.editor-done').addEventListener('click',()=>editor.close());
expanded.addEventListener('input',()=>{if(!editingField)return;$('#drop-'+editingField).value=expanded.value;dirty=true;keepDraft();editorMeta();});
editor.addEventListener('close',()=>{document.documentElement.style.overflow=previousOverflow;editingField=null;editorTrigger?.focus({preventScroll:true});window.scrollTo({left:editorScroll.x,top:editorScroll.y,behavior:'auto'});});
editor.addEventListener('cancel',()=>{ /* Escape closes the panel; each keystroke is already retained as a draft. */ });
root.addEventListener('click',e=>{
 const expand=e.target.closest('[data-editor]');if(expand){openEditor(expand.dataset.editor,expand);return;}
 const date=e.target.closest('[data-date]')?.dataset.date;if(date){chooseDate(date);return;}
 const pick=e.target.closest('[data-theme-pick]')?.dataset.themePick;if(pick){themeMode=pick;setTheme();persist();return;}
 const action=e.target.closest('[data-action]')?.dataset.action;
 if(action==='save')saveRecord();
 if(action==='today')chooseDate(dayKey());
 if(action==='month'){const p=$('.month');p.hidden=!p.hidden;$('.month-toggle').setAttribute('aria-expanded',String(!p.hidden));month=parse(selected);renderMonth();}
 if(action==='prev-month'||action==='next-month'){month=new Date(month.getFullYear(),month.getMonth()+(action==='prev-month'?-1:1),1);renderMonth();}
});
$('.journal').addEventListener('input',e=>{dirty=true;if(e.target.tagName==='TEXTAREA')autosize(e.target);keepDraft();});
$('.journal').addEventListener('submit',e=>{e.preventDefault();saveRecord();});bindDrop($('.save'));
function keepEditorVisible(){if(editor.open){fitExpandedEditor();return;}const el=document.activeElement;if(!el?.matches('#waterdrop-demo textarea'))return;requestAnimationFrame(()=>{const viewport=window.visualViewport,top=viewport?.offsetTop||0,bottom=top+(viewport?.height||innerHeight),bounds=el.getBoundingClientRect();if(bounds.top<top+18)window.scrollBy({top:bounds.top-top-18,behavior:'auto'});else if(bounds.bottom>bottom-24)window.scrollBy({top:bounds.bottom-bottom+24,behavior:'auto'});});}
window.visualViewport?.addEventListener('resize',keepEditorVisible);
window.addEventListener('resize',keepEditorVisible);
$('.journal').addEventListener('focusin',()=>setTimeout(keepEditorVisible,180));
window.addEventListener('beforeunload',e=>{if(dirty&&!stash()){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{if(dirty)keepDraft();});
root.addEventListener('keydown',e=>{if(e.key==='Escape'){$('.month').hidden=true;$('.month-toggle').setAttribute('aria-expanded','false');}});
function applyState(s){if(!s)return;if(valid(s.selected))selected=s.selected;if(['auto','cloud','sea'].includes(s.themeMode))themeMode=s.themeMode;if(s.records&&typeof s.records==='object')for(const[k,r]of Object.entries(s.records).slice(-3)){if(valid(k)&&r&&['good','loss','next'].every(f=>typeof r[f]==='string'&&r[f].length<=400))records[k]=r}renderWeek();loadFields();setTheme();}
applyState(window.openai?.widgetState?.privateContent);window.addEventListener('openai:set_globals',e=>{const s=e.detail?.globals?.widgetState?.privateContent;if(!dirty&&s&&(s.selected!==selected||s.themeMode!==themeMode))applyState(s)});
renderWeek();setTheme();loadFields();root.querySelectorAll('button').forEach(b=>b.classList.add('cursor-interaction'));
setInterval(()=>{const next=dayKey();if(next!==today){today=next;setTheme()}},60000);
if(globalThis.Tweak){const opts={theme:'auto'};const tweak=new Tweak({container:root,onChange:()=>{themeMode=opts.theme;setTheme();persist()}});tweak.addSelect(opts,'theme',{label:'预览背景',options:[{label:'每日随机',value:'auto'},{label:'云光',value:'cloud'},{label:'海光',value:'sea'}]});}
})();
