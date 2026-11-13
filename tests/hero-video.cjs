// Logic tests only: actual desktop/mobile autoplay still requires browser QA.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/hero-video.js'),'utf8');
function harness({mobile=false,reduced=false,saveData=false,reject=false}={}) {
  const events={}; const classes=new Set(); const media={matches:reduced,addEventListener:(_,cb)=>events.motion=cb};
  const v={dataset:{mobileSrc:'mobile.mp4',desktopSrc:'desktop.mp4'},
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
    hasAttribute:()=>!!v.src,removeAttribute:()=>delete v.src,load:()=>{},
    pause:()=>{v.paused=true;events.pause?.();},
    play:()=>{v.paused=false;v.plays=(v.plays||0)+1;return reject?Promise.reject(Error('blocked')):Promise.resolve();},
    addEventListener:(name,cb)=>events[name]=cb,closest:()=>({})};
  const doc={hidden:false,querySelector:()=>v,addEventListener:(name,cb)=>events[name]=cb};
  vm.runInNewContext(code,{document:doc,navigator:{connection:{saveData}},window:{matchMedia:q=>q.includes('reduced')?media:{matches:mobile},setTimeout:()=>1,clearTimeout:()=>{}}});
  return {v,events,media,doc,classes};
}
test('desktop/mobile use separate muted inline media',()=>{
 for(const mobile of [false,true]){const h=harness({mobile});assert.equal(h.v.src,mobile?'mobile.mp4':'desktop.mp4');assert.equal(h.v.muted,true);assert.equal(h.v.playsInline,true);assert.equal(h.classes.size,0);h.events.playing();assert.equal(h.classes.has('is-playing'),true);}
});
test('reduced motion and Save-Data skip video download',()=>{
 for(const options of [{reduced:true},{saveData:true}]){const h=harness(options);assert.equal(h.v.src,undefined);assert.equal(h.v.plays,undefined);}
});
test('autoplay rejection releases media and keeps photograph',async()=>{const h=harness({reject:true});await Promise.resolve();assert.equal(h.v.src,undefined);assert.equal(h.classes.size,0);});
test('load errors release media and retain fallback',()=>{const h=harness();h.events.playing();h.events.error();assert.equal(h.v.src,undefined);assert.equal(h.classes.size,0);});
test('changing motion preference immediately stops and unloads',()=>{const h=harness();h.events.playing();h.media.matches=true;h.events.motion();assert.equal(h.v.src,undefined);assert.equal(h.classes.size,0);h.media.matches=false;h.events.motion();assert.equal(h.v.src,'desktop.mp4');});
test('hidden tabs pause; visible tabs resume',()=>{const h=harness();h.events.playing();h.doc.hidden=true;h.events.visibilitychange();assert.equal(h.v.paused,true);assert.equal(h.classes.size,0);h.doc.hidden=false;h.events.visibilitychange();assert.equal(h.v.paused,false);});
test('waiting displays fallback until actual playback resumes',()=>{const h=harness();h.events.playing();h.events.waiting();assert.equal(h.classes.size,0);h.events.playing();assert.equal(h.classes.has('is-playing'),true);});
test('markup preserves autoplay, loop, poster and no native controls',()=>{const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const tag=html.match(/<video\b[^>]*>/)[0];for(const attr of ['autoplay','muted','loop','playsinline','poster=','preload="none"'])assert.ok(tag.includes(attr));assert.ok(!tag.includes(' controls'));assert.ok(!/\ssrc=/.test(tag));});
