/* Public settings only: never place API keys or n8n credentials here. */
window.SITE_CONFIG = Object.freeze({
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
