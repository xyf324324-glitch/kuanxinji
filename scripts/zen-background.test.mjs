import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
const source=readFileSync(new URL('../design/zen/app.js',import.meta.url),'utf8')
const play=source.slice(source.indexOf('async function playAudio()'),source.indexOf("audio.addEventListener('play'"))
const visibility=source.slice(source.indexOf("document.addEventListener('visibilitychange'"),source.indexOf(';reduced.addEventListener'))
function setup(){const audio={paused:true,volume:1,error:null,ended:false,async play(){this.paused=false},pause(){this.paused=true}};const state={audio,files:[{}],track:0,enabled:true,loading:false,playing:false,blocked:false,playRequest:0,active:true,sessionInterrupted:false,document:{hidden:false,addEventListener(_,fn){state.onVisibility=fn}},updatePlay(){},tick(){},motion(){},openSheet(){},notice(){},setVolume(v){audio.volume=v},stopFade(){},fadeIn(){state.fadeCount++},fadeCount:0,AudioContext:class{constructor(){throw Error('Playback must not create a Web Audio output')}}};vm.createContext(state);vm.runInContext(play+'\n'+visibility,state);return state;}
test('native playback starts without constructing or awaiting AudioContext',async()=>{const s=setup();await s.playAudio();assert.equal(s.audio.paused,false);assert.equal(s.playing,true);assert.equal(s.fadeCount,1)})
test('locking during meditation preserves audio and finishes any volume fade',async()=>{const s=setup();await s.playAudio();s.document.hidden=true;s.audio.volume=.05;s.onVisibility();assert.equal(s.audio.paused,false);assert.equal(s.audio.volume,1)})
test('outside meditation backgrounding still stops music as requested',async()=>{const s=setup();await s.playAudio();s.active=false;s.document.hidden=true;s.onVisibility();assert.equal(s.audio.paused,true)})
test('returning after a system media pause clears the playing state',async()=>{const s=setup();await s.playAudio();s.audio.pause();s.onVisibility();assert.equal(s.playing,false)})
test('late play resolution cannot restart a cancelled fade',async()=>{const s=setup();let complete;s.audio.play=()=>new Promise(resolve=>{complete=resolve});const pending=s.playAudio();s.pauseAudio();complete();await pending;assert.equal(s.fadeCount,0);assert.equal(s.playing,false)})
