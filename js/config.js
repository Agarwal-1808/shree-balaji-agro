/* Public settings only: never place API keys or n8n credentials here. */
window.SITE_CONFIG = Object.freeze({
  company: {
    name: 'Shree Balaji Agro Farm Private Limited',
    brand: 'Shree Bhog',
    phone: '+919031746938',
    phoneDisplay: '+91 9031746938',
    email: 'shreebalajiagro.cbsa@gmail.com',
    address: 'Ranjitpur, Jharkhand 831002, India',
    siteUrl: '' // Set the approved HTTPS domain only when available.
  },
  social: { facebook: '', instagram: '' },
  enquiry: {
    webhookUrl: '',
    // Enable only after the real endpoint passes the checklist in README.md.
    webhookVerified: false,
    timeoutMs: 15000
  },
  maps: {
    businessUrl: 'https://maps.app.goo.gl/C4Exgk9TKozG9GiR8?g_st=ic'
  }
});
