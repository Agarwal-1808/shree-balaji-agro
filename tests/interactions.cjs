// Behaviour-level tests with a small DOM harness. Not browser/visual tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/script.js'), 'utf8');

class Element {
  constructor(value = '') {
    this.value = value; this.attrs = {}; this.dataset = {}; this.listeners = {};
    this.disabled = true; this.textContent = ''; this.validityMessage = '';
    const classes = new Set();
    this.classList = {
      toggle: (key, enabled) => enabled ? classes.add(key) : classes.delete(key),
      remove: key => classes.delete(key), contains: key => classes.has(key)
    };
  }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(key, callback) { (this.listeners[key] ||= []).push(callback); }
  async emit(key, event = {}) { for (const fn of this.listeners[key] || []) await fn(event); }
  setCustomValidity(value) { this.validityMessage = value; }
  focus() { this.focused = true; }
}
function setup({ config = {}, search = '', mobile = false, fetcher } = {}) {
  const ids = {};
  for (const id of ['name','phone','email','business','product','message','enquiry-form','submit-enquiry','form-note','form-status','main-nav']) ids[id] = new Element();
  const menu = new Element(); menu.setAttribute('aria-expanded', 'false');
  const year = new Element(); const document = new Element();
  const media = new Element(); media.matches = mobile;
  const fields = {name:'Test Customer',phone:'+91 90000 00000',email:'test@example.com',businessType:'Retailer',productInterest:'Gold Rice',message:'Please share availability.',consent:'on',website:''};
  for (const key of ['name','phone','email','message']) ids[key].value = fields[key];
  ids.business.options = ['', 'Distributor', 'Retailer'].map(value => ({ value }));
  ids.product.options = ['', 'Gold Rice', 'Sooji'].map(value => ({ value }));
  ids['enquiry-form'].reportValidity = () => !Object.values(ids).some(el => el.validityMessage);
  document.querySelector = selector => selector === '.menu-toggle' ? menu : ids[selector.slice(1)];
  document.querySelectorAll = selector => selector === '[data-year]' ? [year] : [];
  document.getElementById = id => ids[id];
  const requests = [];
  const window = {
    SITE_CONFIG: { enquiry: config }, location: {href:'https://example.com/contact.html',search},
    matchMedia: query => query.includes('max-width') ? media : {matches:true},
    setTimeout, clearTimeout, crypto: { randomUUID: () => 'test-enquiry-id' }
  };
  vm.runInNewContext(source, {window,document,URL,URLSearchParams,Date,JSON,Math,AbortController,
    FormData: class {get(key) { return fields[key]; }},
    fetch: async (url, options) => { requests.push({url,options}); return fetcher ? fetcher(url,options) : {ok:true,json:async()=>({success:true})}; }
  });
  const submit = () => ids['enquiry-form'].emit('submit', {preventDefault(){}});
  return {ids, menu,media,document,year,fields,requests,submit};
}
const enabled = {webhookUrl:'https://example.com/enquiry',webhookVerified:true,timeoutMs:30};
test('unconfigured and unverified forms never send', async () => {
  for (const config of [{}, {webhookUrl:enabled.webhookUrl}, {...enabled,webhookUrl:'http://example.com'}, {...enabled,webhookUrl:'https://user:secret@example.com'}]) {
    const s=setup({config}); await s.submit(); assert.equal(s.requests.length,0); assert.equal(s.ids['submit-enquiry'].disabled,true);
  }
});
test('mobile navigation expands, Escape closes and restores focus', async () => {
  const s=setup({mobile:true}); assert.equal(s.ids['main-nav'].classList.contains('is-collapsed'),true);
  await s.menu.emit('click'); assert.equal(s.menu.getAttribute('aria-expanded'),'true');
  await s.document.emit('keydown',{key:'Escape'}); assert.equal(s.menu.focused,true); assert.equal(s.menu.getAttribute('aria-expanded'),'false');
  s.media.matches=false; await s.media.emit('change'); assert.equal(s.ids['main-nav'].classList.contains('is-collapsed'),false);
});
test('product and business query parameters select only known options', () => {
  const s=setup({search:'?product=Gold%20Rice&business=Distributor'});
  assert.equal(s.ids.product.value,'Gold Rice');assert.equal(s.ids.business.value,'Distributor');
  assert.equal(setup({search:'?product=%3Cscript%3E'}).ids.product.value,'');
});
test('copyright follows the current year',()=>assert.equal(setup().year.textContent,new Date().getFullYear()));
test('trimmed name, message and phone validation block invalid requests',async()=>{
  for(const [key,value] of [['name','   '],['message','  short  '],['phone','abc1234']]) {
    const s=setup({config:enabled});s.ids[key].value=value;await s.submit();assert.equal(s.requests.length,0);
  }
});
test('honeypot blocks bots',async()=>{
  const s=setup({config:enabled});s.fields.website='spam';await s.submit();assert.equal(s.requests.length,0);
});
test('success sends full payload and blocks identical second submission',async()=>{
  const s=setup({config:enabled});await s.submit();await s.submit();assert.equal(s.requests.length,1);
  const payload=JSON.parse(s.requests[0].options.body);
  for(const key of ['name','phone','email','businessType','productInterest','message','consent','requestId']) assert.ok(payload[key]);
  assert.equal(s.ids['form-status'].dataset.state,'success');assert.equal(s.ids.name.value,'Test Customer');
});
test('in-flight duplicate clicks are locked',async()=>{
  let resolve;const s=setup({config:enabled,fetcher:()=>new Promise(r=>resolve=r)});
  const pending=s.submit();assert.equal(s.ids['submit-enquiry'].disabled,true);await s.submit();assert.equal(s.requests.length,1);
  resolve({ok:true,json:async()=>({success:true})});await pending;assert.equal(s.ids['submit-enquiry'].disabled,false);
});
test('HTTP, malformed and unacknowledged responses show error; preserve input',async()=>{
  for(const response of [{ok:false,json:async()=>({success:true})},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('not JSON');}}]) {
    const s=setup({config:enabled,fetcher:async()=>response});await s.submit();assert.equal(s.ids['form-status'].dataset.state,'error');assert.equal(s.ids.name.value,'Test Customer');
  }
});
test('failed retry reuses request ID, abort timeout recovers button',async()=>{
  const s=setup({config:enabled,fetcher:async()=>{throw Error('offline');}});await s.submit();await s.submit();
  assert.equal(JSON.parse(s.requests[0].options.body).requestId,JSON.parse(s.requests[1].options.body).requestId);
  const t=setup({config:enabled,fetcher:(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))))});
  await t.submit();assert.equal(t.ids['form-status'].dataset.state,'error');assert.equal(t.ids['submit-enquiry'].disabled,false);
});
