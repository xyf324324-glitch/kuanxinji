// Personal audio stays on this device. Failed transactions never claim success.
window.ZenStore = (() => {
  let pending;
  function db(){return pending ||= new Promise((resolve,reject)=>{const r=indexedDB.open('kuanxin-zen-audio',1);r.onupgradeneeded=()=>r.result.createObjectStore('tracks',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async function run(mode,action){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('tracks',mode);const r=action(t.objectStore('tracks'));t.oncomplete=()=>resolve(r.result);t.onabort=t.onerror=()=>reject(t.error||r.error);});}
  return {all:()=>run('readonly',s=>s.getAll()),put:track=>run('readwrite',s=>s.put(track)),remove:id=>run('readwrite',s=>s.delete(id))};
})();
