# Shree Balaji Agro Farm Private Limited

A complete four-page website built from scratch with HTML5, CSS3 and vanilla JavaScript, inspired by the supplied Wix screen recording. Development is on `website-redesign` only. Do not merge into `main` or deploy until the owner approves.

## Open in VS Code

1. Open this repository folder in VS Code. Confirm the branch shown at the bottom is **website-redesign**.
2. Open a terminal in VS Code and run `python3 -m http.server 8000 --bind 127.0.0.1` (Windows: `py -m http.server 8000 --bind 127.0.0.1`).
3. Visit **http://127.0.0.1:8000** in your browser.
4. Stop the server with Ctrl+C when finished.

Alternatively, use VS Code's Live Server extension. You can open `index.html` directly for basic viewing, but use HTTP for development and form integration. No npm installation or build is required. No proprietary builder, external font request, analytics or tracking is used.

## Structure

```
index.html             Home
about.html             Company history, manufacturing and regional presence
products.html          All eight products, divided into rice and flour
contact.html           Contact details, verified Maps link and enquiry form
css/styles.css         Shared responsive design system
js/config.js           Public webhook and map settings
js/script.js           Navigation, reveals, enquiry preselection and submission
assets/images/         Optimized WebP image derivatives
assets/icons/grain.svg Decorative mark for clearly labelled image placeholders
images/                Original media, preserved byte-for-byte
scripts/check_site.py  Static content, asset and original-file checks
tests/interactions.cjs JavaScript behaviour tests (Node built-ins only)
docs/REVIEW.md         Content confirmation and pre-publication checklist
```

The original `factory-inside.jpg` is an **exterior factory/courtyard** image. It is not presented as an interior. No videos existed in the source repository. The old unused `style.css` was removed from this branch; the old experiment remains in Git history and on `main`.

## Edit content and design

- **Text:** edit the appropriate HTML file. All content is real HTML and remains available without JavaScript. Header and footer markup are intentionally repeated in all four files so there is no runtime template dependency; update all four when changing shared contact details or navigation.
- **Colours:** edit `:root` at the top of `css/styles.css`. `--olive`, `--cream` and `--gold` control the visual identity.
- **Fonts:** change `--serif` and `--sans`. Current typography uses local system fonts, so appearance varies slightly by platform. There are no font licences or third-party requests to manage.
- **Images:** keep originals in `images/`; place web-ready derivatives in `assets/images/`. Update `src`, `srcset`, `sizes`, `width`, `height` and descriptive `alt` text. Srcset width descriptors must match actual pixel widths. Keep the main hero eager/high priority and below-fold images lazy loaded.
- **Missing product art:** replace `.pack-placeholder` inside the relevant `.product-art` with an image once genuine art is available. Do not turn the placeholder into an invented branded pack. Missing: Alcor Mansoori Rice, Premium Maida, Bakery Maida and Sooji. The existing Atta artwork contains two pack designs together.
- **Products:** edit the cards in `products.html`, featured cards in `index.html`, and options in the contact form. Each enquiry button passes a URL-encoded product name to `contact.html?product=...`; names must match the corresponding option exactly.
- **Phone:** +91 7061157272, including `tel:` and `wa.me` links throughout. The older phone has been replaced.
- **Maps:** the contact page uses the exact business link supplied by the owner: https://maps.app.goo.gl/C4Exgk9TKozG9GiR8?g_st=ic. It opens externally. The redirect could not be resolved in this environment, so there is no invented coordinate or unverified embedded map. To embed the map later, obtain its official Share → Embed a map URL and replace the photo/location panel with a titled, lazy-loaded iframe; retain the direct link. `config.js` records the approved URL for reference; HTML contains the working no-JS link.
- **Social accounts:** no Facebook or Instagram URLs were supplied/verified, so none are invented. WhatsApp uses the owner-provided number; the account's availability must be checked before launch.
- **SEO:** every page has its own title, description and Open Graph text. Add canonical URLs, absolute Open Graph image/URL metadata, sitemap and robots settings once the final domain and publication status are known. Do not publish preview URLs as canonical URLs.

## n8n integration — disabled until configured AND tested

The frontend contains no credentials. Online submission remains disabled unless both `webhookUrl` is a valid HTTPS endpoint and `webhookVerified` is `true`. Call, email and WhatsApp actions work independently. Setting an arbitrary URL alone does not activate the form.

1. Create a production POST endpoint, preferably behind a same-origin server proxy that forwards to n8n. A direct n8n HTTPS URL is also supported if CORS is configured. Keep private keys on the server, never in `config.js`.
2. Validate all fields on the server, enforce length limits, validate consent, apply rate limiting/spam protection and safely persist or forward enquiries. Browser validation and the honeypot are supplementary, not security boundaries.
3. For cross-origin delivery, support OPTIONS and allow the production site's exact Origin, POST, Content-Type and Accept. Do not use `no-cors` or treat opaque responses as success.
4. Persist an enquiry and its `requestId` atomically. Deduplicate on `requestId`; return the same acknowledgement when that ID is retried. Only return a 2xx JSON response `{"success":true}` after accepting the enquiry. A generic “workflow started” message will not count as success. Other statuses or response formats show an error.
5. Set `enquiry.webhookUrl` in `js/config.js`. Use a private development copy to enable `webhookVerified: true` for integration tests. Test valid delivery, rejected input, CORS, offline/timeouts, server errors, non-JSON responses and repeated clicks. Verify actual receipt in n8n/destination storage, not only the browser message.
6. Only after those tests pass, set `webhookVerified: true` in the intended release configuration. Obtain owner approval before publishing.

Collected fields: name, phone, email, business type, product interest, message and consent. Example JSON (illustrative customer data):

```json
{
  "schemaVersion": 1,
  "requestId": "a-unique-enquiry-id",
  "source": "shree-balaji-agro-website",
  "submittedAt": "2026-11-11T12:00:00.000Z",
  "name": "Example Customer",
  "phone": "+919000000000",
  "email": "customer@example.com",
  "businessType": "Retailer",
  "productInterest": "Gold Rice",
  "message": "Please share product availability.",
  "consent": true
}
```

Requests time out after 15 seconds. In-flight submissions are locked. Identical successfully acknowledged enquiries are blocked for that page session. Retries of the same unsent details reuse a request ID. No automatic retry occurs. Timeouts may happen after server receipt, so the UI advises calling/emailing before retrying. Page reloads reset this in-memory protection; backend deduplication is essential. No personal data is placed in localStorage or sessionStorage.

## Checks

Run `python3 scripts/check_site.py` and `node --testtests/interactions.cjs`. These require no third-party packages. They validate local links/anchors/media, page metadata, original media integrity, catalogue and core JavaScript behaviours. They do **not** replace browser layout testing or a real n8n integration test.

Before publication, follow `docs/REVIEW.md`, review all four pages at phone, tablet and desktop widths, inspect browser console/network errors, verify the Maps destination and WhatsApp account, and test the real webhook if enabling it.
