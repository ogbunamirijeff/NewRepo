/* =========================================================================
   VELOUR GHOST — SITE CONFIGURATION
   Everything that needs a real account or service lives here.
   Nothing in this file is faked: if a value is null, the site says so
   honestly to the visitor instead of pretending the action succeeded.
   ========================================================================= */
window.VG_CONFIG = {
  locale: 'en-GB',

  /* CHECKOUT — NOT CONNECTED.
     Set `endpoint` to a server route you control (e.g. a Netlify/Vercel
     function) that receives the bag and returns { "url": "<hosted checkout>" }
     — for example a Stripe Checkout Session or a Shopify cart permalink.
     Payload POSTed as JSON:
       { currency, items: [{ sku, slug, name, color, size, qty, unitPrice }] }
     Until set, the bag works fully but checkout shows a clear
     "integration pending" message and takes no payment. */
  checkout: {
    endpoint: null,
    provider: null // 'stripe' | 'shopify' | 'custom' — informational only
  },

  /* NEWSLETTER — NOT CONNECTED.
     Set `endpoint` to a URL accepting POST { email } (JSON), e.g. a
     Klaviyo / Mailchimp / Buttondown proxy function. Until set, the
     form validates input and tells the visitor nothing was stored. */
  newsletter: {
    endpoint: null
  },

  /* SOCIAL + CONTACT — replace placeholders before launch. */
  social: {
    instagram: 'https://instagram.com/',  // TODO: add handle
    tiktok: 'https://www.tiktok.com/'     // TODO: add handle
  },
  contactEmail: null, // e.g. 'studio@yourdomain.com' — shown on the contact page when set

  shipping: {
    freeOver: 300,   // in catalog currency
    regions: ['Nigeria', 'United Kingdom', 'European Union', 'United States', 'Rest of world']
  }
};
