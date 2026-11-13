/* Run after editing js/config.js. Updates static HTML, including no-JS links. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'), context);
const config = context.window.SITE_CONFIG;
const c = config.company;
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
if (!/^\+\d{7,15}$/.test(c.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw Error('Check configured phone/email');
const links = {phone:'tel:'+c.phone,email:'mailto:'+c.email,whatsapp:'https://wa.me/'+c.phone.slice(1)};
const text = {phone:c.phoneDisplay,email:c.email,address:c.address};
const socials = Object.entries(config.social).filter(([,url]) => url).map(([name,url])=>{
 const parsed=new URL(url);const host=parsed.hostname.replace(/^www\./,'');
 if (parsed.protocol!=='https:' || !['facebook.com','instagram.com'].includes(host)) throw Error('Use official HTTPS social profile URLs');
 return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${name==='facebook'?'Facebook':'Instagram'} ↗</a>`;
});
let domain='';
if(c.siteUrl){const url=new URL(c.siteUrl);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Use a clean HTTPS site URL');domain=url.href.replace(/\/$/,'')+'/';}
for(const file of ['index.html','about.html','products.html','contact.html']) {
 const target=path.join(root,file);let html=fs.readFileSync(target,'utf8');
 html=html.replace(/(<a\b[^>]*data-contact-link="(phone|email|whatsapp)"[^>]*href=")[^"]*(")/g,(_,a,key,z)=>a+escape(links[key])+z);
 html=html.replace(/(<(span|strong|p)\b[^>]*data-contact-text="(phone|email|address)"[^>]*>)[\s\S]*?(<\/\2>)/g,(_,a,tag,key,z)=>a+escape(text[key])+z);
 html=html.replace(/<!-- SOCIAL_LINKS_START -->[\s\S]*?<!-- SOCIAL_LINKS_END -->/,`<!-- SOCIAL_LINKS_START --><nav class="wrap social-links" aria-label="Official social media"${socials.length?'':' hidden'}>${socials.join('')}</nav><!-- SOCIAL_LINKS_END -->`);
 const title=html.match(/<title>(.*?)<\/title>/s)[1];
 const description=html.match(/<meta name="description" content="([^"]*)"/)[1];
 const schema={'@context':'https://schema.org','@type':'LocalBusiness',name:c.name,brand:{'@type':'Brand',name:c.brand},telephone:c.phone,email:c.email,address:{'@type':'PostalAddress',streetAddress:'Ranjitpur',addressRegion:'Jharkhand',postalCode:'831002',addressCountry:'IN'},areaServed:['Jharkhand','Odisha','West Bengal']};
 const socialMeta=[`<meta property="og:site_name" content="${escape(c.name)}">`,`<meta property="og:locale" content="en_IN">`,`<meta name="twitter:card" content="${domain?'summary_large_image':'summary'}">`,`<meta name="twitter:title" content="${title}">`,`<meta name="twitter:description" content="${description}">`];
 if(domain){const url=new URL(file==='index.html'?'':file,domain).href;const image=new URL('assets/images/factory-aerial-1600.webp',domain).href;schema.url=domain;schema.image=image;socialMeta.push(`<link rel="canonical" href="${url}">`,`<meta property="og:url" content="${url}">`,`<meta property="og:image" content="${image}">`,`<meta property="og:image:alt" content="Factory aerial photograph in Ranjitpur">`,`<meta name="twitter:image" content="${image}">`);}
 const metadata=socialMeta.join('\n    ')+`\n    <script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
 html=html.replace(/<!-- BUSINESS_METADATA_START -->[\s\S]*?<!-- BUSINESS_METADATA_END -->/,`<!-- BUSINESS_METADATA_START -->\n    ${metadata}\n    <!-- BUSINESS_METADATA_END -->`);
 fs.writeFileSync(target,html);
}
console.log('Updated static contact links, social visibility and business metadata on all four pages.');
