# VELOUR GHOST

**Beauty in the shadows, but classy.** This is the website for an independent experimental fashion house. It is built to feel like a forbidden museum, a classified archive and an underground gallery.

It is a static site with no dependencies and no build step. Open it through any static server, or deploy the folder as-is to Netlify, Vercel, GitHub Pages, Cloudflare Pages or S3.

```bash
cd velour-ghost
python3 -m http.server 8000   # → http://localhost:8000
```

---

## What's in it

| Area | Route | Notes |
|---|---|---|
| Opening gate | first visit per session | A loading sequence, then a slow wordmark reveal with the phosphor eye-`o`. **ENTER** or **ENTER WITH SOUND**, followed by an iris transition. Esc skips it. |
| Home | `#/` | Masked-guardian hero with parallax and breathing motion, a manifesto with inline art chips, a chapter index with cursor-following previews, a pinned horizontal gallery, the Specimen 001 feature and an archive teaser. |
| Collections | `#/collections` | Four expanding chapter "doors". |
| Chapter I: The Creatures | `#/collection/the-creatures` | Editorial stagger layout. Hovering a plate reveals the garment. |
| Chapter II: Forbidden Science | `#/collection/forbidden-science` | Lab plates on graph paper, with specimen codes and label tables. |
| Chapter III: Body of Horror | `#/collection/body-of-horror` | Inverted to aged-bone paper. Anatomy-theatre plates printed in black and blood-red ink. |
| Chapter IV: Experimental Typography | `#/collection/experimental-typography` | Brutal full-width rows whose width axis stretches on hover. |
| Product | `#/product/<slug>` | Front, back, a print-and-fabric close-up and the artwork plate. Hovering the first image shows the back. Includes a full-screen zoom viewer, colours, sizes (sold-out sizes are struck through), add to bag, description, fabric, a fit table, shipping, and the edition and chapter. |
| The Archive | `#/archive`, `#/archive/<id>` | A "restricted institution" with a typed terminal, filters and live query. Specimen cards get an x-ray effect and a scan line on hover. Each record opens a dossier with a HUD overlay. |
| About | `#/about` | The manifesto copy as specified. |
| Info | `#/info/shipping`, `returns`, `privacy`, `terms`, `contact` | Placeholder policies, clearly flagged as placeholders. |

Global features:
- Custom cursor on desktop only, with contextual labels (VIEW, ENTER, OPEN FILE, ZOOM).
- Film grain and scanline overlays.
- Slatted page transitions.
- Split-character distorted text reveals.
- Optional generative ambient audio. It is synthesised with Web Audio, starts only on an explicit click, and stays quiet.

### Mobile art direction

The phone layout is designed separately; it is not a shrunken desktop:
- A thumb bar at the bottom of the screen with Menu, Search, Sound and Bag.
- The guardian towers above stacked type in the hero.
- The horizontal gallery becomes a native swipe deck with snapping.
- The product gallery is swipeable and has a progress indicator.
- Archive cards stack two-up.
- Chapter III plates show the garment inset at all times, because a phone has no hover.

### Accessibility

- A skip link.
- Native `<details>` accordions.
- Real radio inputs for colour and size.
- Focus trapping in the gate, menu, search, bag, viewer and dossier, with Esc closing each one.
- Focus returns to where it was when an overlay closes.
- `aria-live` on the bag, search and archive counts.
- Split headings keep an `aria-label`.
- All motion is reduced under `prefers-reduced-motion`.
- Press `/` to open search.

---

## The artwork

**There is no stock photography.** Every image on the site is original engraved SVG artwork, drawn procedurally in `assets/js/art.js`. That covers the creatures, specimens, anatomy plates, typography pieces, garments and the print close-ups. The artwork is seeded, so it renders identically every time and stays sharp at any zoom.

There are 21 pieces:
- **Chapter I:** masquerade, coil, leopard, lagoon, zuma, rider.
- **Chapter II:** specimen, contact, organism, anatomy, classified.
- **Chapter III:** ribcage, heart, spine, hand, eye, skull.
- **Chapter IV:** illegible, signal, misreg, letterform.

Cultural references are handled as quiet, specific nods rather than decoration or pattern:
- Masquerade raffia tiers.
- Facial scarification lines.
- Granulated bronze-work edges on *Coil*.
- The Zuma monolith.
- Durbar-season horsemen.
- The Lagos lagoon.

There are no African-print backgrounds and no religious iconography.

### Replacing artwork with real photography

Each product has an `images` field in `assets/js/catalog.js`. Leave it `null` to keep using the generated art. To use your own photographs:

```js
images: { front: '/img/coil-front.jpg', back: '/img/coil-back.jpg', detail: '/img/coil-detail.jpg', plate: '/img/coil-plate.jpg' }
// or per colour:
images: { black: { front: '…', back: '…' }, bone: { front: '…' } }
```

---

## Working vs. needs configuration

Nothing here fakes a transaction.

| Feature | Status |
|---|---|
| Navigation, routing, search, filters, product options, size tables, lightbox | ✅ **Working** |
| Shopping bag (add, quantity, remove, subtotal, free-shipping meter, persisted in `localStorage`) | ✅ **Working** |
| **Checkout** | ⚠️ **Not connected.** When the visitor presses checkout, the site tells them plainly that payments aren't configured and that nothing was charged. |
| **Newsletter** | ⚠️ **Not connected.** The form validates the email address, then tells the visitor their address was *not* stored. |
| Social links, contact email | ⚠️ **Placeholders.** Set them in `config.js`. |
| Shipping, returns, privacy and terms copy | ⚠️ **Placeholder text**, flagged on each page. Replace it before launch. |

### Connecting checkout

Set `VG_CONFIG.checkout.endpoint` in `assets/js/config.js` to a server function you control. The site POSTs this JSON to it:

```json
{ "currency": "USD", "items": [{ "sku": "VG-C-002-BONE-M", "slug": "coil", "name": "Coil", "color": "bone", "size": "M", "qty": 1, "unitPrice": 110 }] }
```

The function must reply with `{ "url": "https://…" }`. That URL should point to a hosted checkout, for example a Stripe Checkout Session or a Shopify cart permalink, and the visitor is redirected there. **Always re-price on the server.** Never trust `unitPrice` from the client.

### Connecting the newsletter

Set `VG_CONFIG.newsletter.endpoint` to a URL that accepts POST `{ "email": "…" }`. This would typically be a small proxy in front of Klaviyo, Mailchimp or Buttondown. A 2xx response shows the success state.

---

## Content model (CMS-ready)

All content lives in `assets/js/catalog.js` as plain objects that map 1:1 to CMS entries such as Sanity, Contentful or Shopify metafields. To move it into a CMS, replace that file with a fetch that produces the same shape.

- **chapter**: `slug, num, code, title, theme ('creatures'|'science'|'body'|'type'), cover (art key), line, intro`
- **product**: `slug, name, chapter, code, art, garment ('tee'|'longsleeve'|'hoodie'|'jacket'), price, edition, colors ('black'|'bone'|'blood'), sizes, soldOut, detail [x,y,w,h crop of the art for the close-up], images, description, fabric[], fit`
- **archive record**: `id, name, art, classification, origin, status, year, description, product (slug|null)`, plus optional `seed, variant, code, jarLabel` for art variants

Currency and locale are set by `catalog.currency` and `config.locale`.

## SEO notes

- Semantic landmarks are used throughout.
- Each route sets its own `<title>` and meta description.
- There is Organization JSON-LD for the site, and Product JSON-LD is injected on product pages.
- There is a `<noscript>` fallback.

Routing is hash-based so the site works on any static host without rewrite rules. For full crawlability, switch to history-API routes with server rewrites, or prerender the routes.

## Files

```
velour-ghost/
├── index.html            shell, gate, header, overlays
├── favicon.svg           the phosphor eye
├── robots.txt
└── assets/
    ├── css/main.css      design system, chapter themes, mobile art direction
    └── js/
        ├── config.js     integrations (checkout, newsletter, socials)
        ├── catalog.js    chapters, products, archive records
        ├── art.js        the art engine (all imagery)
        ├── audio.js      optional generative atmosphere
        └── app.js        router, views, bag, search, archive, cursor, transitions
```
