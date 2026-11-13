'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
test('central configuration updates every static page and is repeatable',()=>{
 const root=path.resolve(__dirname,'..'), tmp=fs.mkdtempSync(path.join(os.tmpdir(),'balaji-contact-'));
 const pages=['index.html','about.html','products.html','contact.html'];
 try {
  for(const dir of ['js','scripts'])fs.mkdirSync(path.join(tmp,dir));
  for(const file of [...pages,'js/config.js','scripts/sync-contact.cjs'])fs.copyFileSync(path.join(root,file),path.join(tmp,file));
  const config=path.join(tmp,'js/config.js');
  fs.writeFileSync(config,fs.readFileSync(config,'utf8').replaceAll('9031746938','9000000000').replace('shreebalajiagro.cbsa@gmail.com','office@example.com').replace("siteUrl: ''","siteUrl: 'https://example.com'"));
  const run=()=>execFileSync(process.execPath,[path.join(tmp,'scripts/sync-contact.cjs')]);run();
  for(const page of pages){
   const html=fs.readFileSync(path.join(tmp,page),'utf8');
   assert.ok(html.includes('tel:+919000000000'));assert.ok(html.includes('https://wa.me/919000000000'));assert.ok(html.includes('mailto:office@example.com'));
   assert.ok(!html.includes('9031746938'));assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('aria-label="Official social media" hidden'));
   const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema.email,'office@example.com');
  }
  const before=pages.map(p=>fs.readFileSync(path.join(tmp,p),'utf8'));run();assert.deepEqual(pages.map(p=>fs.readFileSync(path.join(tmp,p),'utf8')),before);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
