// Read analysis of the shipped recording by native playback time. Never route
// audible output through AudioContext: suspending visuals must not mute music.
window.ZenMusicVisuals = (() => {
  const cache=new Map();let version=0,current=null,captureContext,captureSource,captureAnalyser,captured,wave,frequencies,silent;
  function release(){captureSource?.disconnect();silent?.disconnect();captured?.getTracks().forEach(t=>t.stop());captured=null;captureSource=null;captureAnalyser=null;captureContext?.suspend().catch(()=>{});}
  async function load(track){const token=++version;current=null;if(!track?.builtin)return;
    const url=new URL(`assets/music-analysis/${track.url.split('/').pop().replace('.mp3','.bin')}`,location.href).href;
    try{let data=cache.get(url);if(!data){const response=await fetch(url);if(!response.ok)return;data=new Uint8Array(await response.arrayBuffer());if(data.length%42)return;cache.set(url,data);}if(token===version)current=data;}catch{}
  }
  function sample(seconds){if(!current)return null;const count=current.length/42,index=Math.min(count-1,Math.max(0,Math.floor(seconds*22050/2756))),next=Math.min(count-1,index+1),mix=Math.max(0,Math.min(1,seconds*22050/2756-index));const values=new Float32Array(42);for(let i=0;i<42;i++)values[i]=(current[index*42+i]*(1-mix)+current[next*42+i]*mix)/255;return values;}
  // Optional analysis of a captured copy for personal files. Never use
  // createMediaElementSource, which takes ownership of native audible output.
  function capture(audio){if(captured||!audio.captureStream)return;try{const owner=audio.ownerDocument.defaultView;captureContext ||= new (owner.AudioContext||owner.webkitAudioContext)();captured=audio.captureStream();if(!captured.getAudioTracks().length){release();return;}captureSource=captureContext.createMediaStreamSource(captured);captureAnalyser=captureContext.createAnalyser();captureAnalyser.fftSize=1024;silent=captureContext.createGain();silent.gain.value=0;captureSource.connect(captureAnalyser);captureAnalyser.connect(silent);silent.connect(captureContext.destination);wave=new Float32Array(1024);frequencies=new Uint8Array(512);captureContext.resume().catch(()=>{});}catch{release();}}
  function personal(){if(!captureAnalyser||captureContext.state!=='running')return null;captureAnalyser.getFloatTimeDomainData(wave);captureAnalyser.getByteFrequencyData(frequencies);const values=new Float32Array(42);let sum=0;for(const v of wave)sum+=v*v;values[0]=Math.min(1,Math.sqrt(sum/wave.length)*4);for(let i=0;i<41;i++){const low=Math.floor(60*Math.pow(200,i/41)/captureContext.sampleRate*1024),high=Math.min(512,Math.max(low+1,Math.ceil(60*Math.pow(200,(i+1)/41)/captureContext.sampleRate*1024)));for(let n=low;n<high;n++)values[i+1]+=frequencies[n]/255;values[i+1]/=Math.max(1,high-low);}return values;}
  return {load:track=>{release();return load(track);},sample:seconds=>sample(seconds)||personal(),capture};
})();
