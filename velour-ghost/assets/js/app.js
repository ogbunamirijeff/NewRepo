/* =========================================================================
   VELOUR GHOST — APPLICATION
   Hash-routed single page app. No dependencies, no build step.
   ========================================================================= */
(function () {
  'use strict';
  const D = window.VG_CATALOG, A = window.VGArt, CFG = window.VG_CONFIG, AU = window.VGAudio;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const html = document.documentElement, main = $('#main');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine) and (hover: hover)').matches;
  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const money = v => new Intl.NumberFormat(CFG.locale || 'en-GB', { style: 'currency', currency: D.currency, maximumFractionDigits: 0 }).format(v);

  const P = {}; D.products.forEach(p => P[p.slug] = p);
  const CH = {}; D.chapters.forEach(c => CH[c.slug] = c);
  const byChapter = slug => D.products.filter(p => p.chapter === slug);
  const statusKey = s => s.toLowerCase().replace(/\s+/g, '-');
  let enteredResolve; const entered = new Promise(r => enteredResolve = r);

  /* ---------- textures ---------- */
  (function textures() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 220; const x = c.getContext('2d'); const img = x.createImageData(220, 220);
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = Math.random() < .5 ? 255 : 0; }
      x.putImageData(img, 0, 0); html.style.setProperty('--noise', `url(${c.toDataURL('image/png')})`);
    } catch (e) { }
    const paper = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.012 .5' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .32  0 0 0 0 .25  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`;
    html.style.setProperty('--paper', `url("data:image/svg+xml,${encodeURIComponent(paper)}")`);
  })();

  /* ---------- art painting (lazy) ---------- */
  const artDiv = (key, opts, extra = '') => `<div class="art" data-art="${key}"${opts ? ` data-opts='${JSON.stringify(opts)}'` : ''} ${extra}></div>`;
  const artSpan = (key, opts) => artDiv(key, opts).replace(/^<div/, '<span').replace(/<\/div>$/, '</span>');
  const recOpts = r => { const o = {}; ['seed', 'variant', 'code'].forEach(k => r[k] != null && (o[k] = r[k])); if (r.jarLabel) o.jar = r.jarLabel; o.label = r.name; return o; };
  const garmentDiv = (slug, side, color) => `<div class="art" data-garment="${slug}|${side}|${color}"></div>`;
  function photo(p, side, color) { const im = p.images; if (!im) return null; return (im[color] && im[color][side]) || im[side] || null; }
  function paint(el) {
    if (el.dataset.painted === '1') return; el.dataset.painted = '1';
    try {
      if (el.dataset.art) { const o = el.dataset.opts ? JSON.parse(el.dataset.opts) : {}; el.innerHTML = A.render(el.dataset.art, o); }
      else if (el.dataset.garment) { const [slug, side, color] = el.dataset.garment.split('|'); const p = P[slug]; const src = photo(p, side, color); el.innerHTML = src ? `<img src="${esc(src)}" alt="${esc(p.name)} — ${side}" loading="lazy">` : (side === 'plate' ? A.render(p.art, { label: p.name, seed: p.seed, variant: p.variant }) : A.garment(p, side, color)); }
      else if (el.dataset.detail) { const [slug, color] = el.dataset.detail.split('|'); const p = P[slug]; const src = photo(p, 'detail', color); el.innerHTML = src ? `<img src="${esc(src)}" alt="${esc(p.name)} — detail" loading="lazy">` : A.detail(p, color); }
    } catch (e) { console.error(e); }
  }
  const artIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { paint(e.target); artIO.unobserve(e.target); } }), { rootMargin: '600px 600px' }) : null;
  function lazyArt(root) { $$('.art[data-art], .art[data-garment], .art[data-detail]', root).forEach(el => { if (el.dataset.painted === '1') return; artIO ? artIO.observe(el) : paint(el); }); }
  function repaint(el, attr, val) { el.dataset[attr] = val; el.dataset.painted = ''; paint(el); }

  /* ---------- bag ---------- */
  let bag = store.get('vg-bag', []).filter(i => P[i.slug]);
  const bagCount = () => bag.reduce((a, i) => a + i.qty, 0);
  const bagTotal = () => bag.reduce((a, i) => a + i.qty * P[i.slug].price, 0);
  function saveBag() { store.set('vg-bag', bag); updateBagUI(); }
  function addToBag(slug, color, size) {
    const f = bag.find(i => i.slug === slug && i.color === color && i.size === size);
    f ? f.qty = Math.min(f.qty + 1, 5) : bag.push({ slug, color, size, qty: 1 });
    saveBag(); AU.chime();
  }
  function updateBagUI() {
    const n = bagCount();
    $$('.bag-count').forEach(e => e.textContent = n);
    $$('[data-open="bag"]').forEach(b => b.setAttribute('aria-label', `Bag, ${n} item${n === 1 ? '' : 's'}`));
    if (!$('#bag').hidden) renderBag();
  }
  function renderBag(note) {
    const items = $('#bag-items'), foot = $('#bag-foot');
    if (!bag.length) {
      items.innerHTML = `<div class="bag__empty"><p>Nothing here yet. The dark is patient.</p><a class="btn" href="#/collections" data-close>Enter the collections</a></div>`;
      foot.innerHTML = ''; return;
    }
    items.innerHTML = bag.map((i, k) => { const p = P[i.slug]; return `<div class="bitem"><a class="bitem__img" href="#/product/${p.slug}" data-close>${garmentDiv(p.slug, 'front', i.color)}</a><div><h3>${esc(p.name)}</h3><div class="bitem__meta">${esc(A.FABRIC[i.color].name)} · Size ${esc(i.size)} · ${p.code}</div><div class="bitem__row"><div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}"><button type="button" data-qty="${k}|-1" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button type="button" data-qty="${k}|1" aria-label="Increase quantity">+</button></div><span class="bitem__price">${money(p.price * i.qty)}</span></div><button class="bitem__remove" type="button" data-remove="${k}">Remove</button></div></div>`; }).join('');
    $$('.art', items).forEach(paint);
    const total = bagTotal(), free = CFG.shipping.freeOver, left = Math.max(0, free - total);
    foot.innerHTML = `<div class="bag__line"><span>Subtotal</span><span>${money(total)}</span></div>
      <div class="bag__ship" aria-hidden="true"><i style="transform:scaleX(${clamp(total / free, 0, 1)})"></i></div>
      <div class="bag__note">${left ? `${money(left)} away from free worldwide shipping.` : 'Free worldwide shipping unlocked.'} Shipping, duties &amp; taxes calculated at checkout.</div>
      <div id="bag-notice">${note || ''}</div>
      <button class="btn btn--solid btn--block" type="button" id="checkout">Proceed to checkout</button>`;
  }
  async function checkout() {
    const notice = $('#bag-notice'); const btn = $('#checkout');
    if (!CFG.checkout || !CFG.checkout.endpoint) {
      notice.innerHTML = `<div class="notice"><b>Checkout not yet connected</b>Payments haven't been configured for this store yet, so no order can be placed and no payment has been taken. Your bag is saved on this device.</div>`;
      return;
    }
    btn.disabled = true; btn.firstChild && (btn.textContent = 'Connecting…');
    try {
      const res = await fetch(CFG.checkout.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currency: D.currency, items: bag.map(i => ({ sku: `${P[i.slug].code}-${i.color}-${i.size}`.toUpperCase(), slug: i.slug, name: P[i.slug].name, color: i.color, size: i.size, qty: i.qty, unitPrice: P[i.slug].price })) }) });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json(); if (!data.url) throw new Error('No checkout URL returned');
      location.href = data.url;
    } catch (e) {
      notice.innerHTML = `<div class="notice"><b>Checkout unavailable</b>We couldn't reach the payment provider. Nothing was charged. Please try again shortly.</div>`;
      btn.disabled = false; btn.textContent = 'Proceed to checkout';
    }
  }

  /* ---------- shared fragments ---------- */
  const logoHTML = () => `<span class="logo"><span>VEL</span><span class="logo__o">${A.mark({ blur: 2 })}</span><span>UR GHOST</span></span>`;
  function pcard(p, color) {
    color = color || p.colors[0]; const ch = CH[p.chapter];
    return `<a class="pcard" href="#/product/${p.slug}" data-cursor="VIEW" data-reveal>
      <figure class="pcard__fig"><span class="pcard__tag">${p.code}</span><span class="pcard__ed">ED. ${p.edition}</span>
        <div class="pcard__front">${garmentDiv(p.slug, 'front', color)}</div><div class="pcard__back" aria-hidden="true">${garmentDiv(p.slug, 'back', color)}</div></figure>
      <div class="pcard__cap"><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span><span class="sub">Ch. ${ch.num} — ${esc(ch.title)} · ${esc(p.garment)}</span></div></a>`;
  }
  function specCard(r, i = 0) {
    return `<article class="spec" data-tilt data-reveal style="--d:${(i % 4) * .08}s" data-group="${r.id.slice(3, 5)}" data-search="${esc((r.name + ' ' + r.classification + ' ' + r.origin + ' ' + r.status + ' ' + r.id).toLowerCase())}">
      <a href="#/archive/${r.id}" data-cursor="OPEN FILE" aria-label="Open record ${r.id}: ${esc(r.name)}">
        <div class="spec__art">${artDiv(r.art, recOpts(r))}<span class="spec__scan"></span><span class="spec__corners"></span><span class="spec__no">No. ${r.id}</span></div>
        <div class="spec__label"><h3>${esc(r.name)}</h3><dl>
          <div><dt>Class.</dt><dd>${esc(r.classification)}</dd></div>
          <div><dt>Origin</dt><dd>${esc(r.origin)}</dd></div>
          <div><dt>Status</dt><dd><span class="status" data-s="${statusKey(r.status)}">${esc(r.status)}</span></dd></div></dl></div>
      </a></article>`;
  }
  function marquee(items, cls = '') {
    const one = items.map(t => `<span>${t}${A.mark({ blur: 1.5 })}</span>`).join('');
    return `<div class="marquee ${cls}" aria-hidden="true"><div class="marquee__track">${one}${one}</div></div>`;
  }
  function footer() {
    const S = CFG.social;
    return `<footer class="ftr">
      <div class="ftr__grid">
        <div class="ftr__brand">${A.mark()}${logoHTML()}<p>Beauty in the shadows, but classy.</p></div>
        <nav class="ftr__links" aria-label="Footer">
          <a href="${esc(S.instagram)}" target="_blank" rel="noopener">Instagram ↗</a><a href="#/info/contact">Contact</a>
          <a href="${esc(S.tiktok)}" target="_blank" rel="noopener">TikTok ↗</a><a href="#/info/shipping">Shipping</a>
          <a href="#/archive">The Archive</a><a href="#/info/returns">Returns</a>
          <a href="#/about">About</a><a href="#/info/privacy">Privacy</a>
          <a href="#/collections">Collections</a><a href="#/info/terms">Terms</a>
        </nav>
        <div class="news"><h2 class="display">Enter the unknown.</h2>
          <form data-newsletter novalidate><label class="sr" for="nl-email">Email address</label><input id="nl-email" type="email" name="email" required placeholder="Your email address" autocomplete="email"><button type="submit">Subscribe →</button></form>
          <div class="news__msg" aria-live="polite"></div>
          <small>New chapters and archive releases. Nothing else. Unsubscribe at any time.</small></div>
      </div>
      <div class="ftr__giant" aria-hidden="true">VEL${A.mark({ blur: 4 })}UR&nbsp;GH${A.mark({ blur: 4 })}ST</div>
      <div class="ftr__base"><span>© ${new Date().getFullYear()} VELOUR GHOST. All rights reserved.</span><span>An experimental fashion house.</span><span>Beauty in the shadows, but classy.</span></div>
    </footer>`;
  }

  /* =======================================================================
     VIEWS
     ======================================================================= */
  function home() {
    const c1 = byChapter('the-creatures');
    const teaser = ['VG-0004', 'VG-0101', 'VG-0202', 'VG-0105'].map(id => D.archive.find(a => a.id === id));
    return {
      title: 'VELOUR GHOST — Beauty in the shadows, but classy.', code: 'VG / CHAPTER 001',
      html: `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__beam"></div>
        <div class="hero__art" data-depth=".22" data-mouse="14">${artDiv('masquerade', { dense: 1, rough: 1, vig: false, label: 'The Last Masquerade — a masked guardian draped in a thousand strands, emerging from darkness' })}</div>
        <div class="hero__fog" data-depth="-.08"></div><div class="hero__fog hero__fog--2"></div>
        <div class="hero__shade"></div>
        <div class="hero__label" aria-hidden="true">VG-0001 / THE LAST MASQUERADE — STATUS: DORMANT</div>
        <div class="hero__copy">
          <div class="hero__chapter" data-reveal><span class="kicker">Chapter 001</span><p class="serif">The <em>Creatures</em></p></div>
          <div class="hero__meta" data-reveal aria-hidden="true"><span>ARCHIVE ACCESS — <b>OPEN</b></span><span>${D.archive.length} RECORDS / ${D.products.length} ARTEFACTS</span><span>ALL EDITIONS LIMITED</span></div>
          <h1 class="hero__title display" id="hero-title" data-split><span class="l1">Velour</span><span class="l2"><span class="outline">Ghost</span></span></h1>
          <div class="hero__side" data-reveal style="--d:.5s"><p>Some things were never meant to be seen.</p>
            <div class="hero__btns"><a class="btn btn--solid" href="#/collection/the-creatures">Enter the collection</a><a class="btn" href="#/archive">Explore the archive</a></div></div>
        </div>
        <div class="hero__scroll" aria-hidden="true"></div>
      </section>
      ${marquee(['Some things were never meant to be seen', 'Beauty in the shadows, but classy', 'Chapter 001 — The Creatures', 'Every garment is an artefact'])}
      <section class="statement" aria-label="Manifesto">
        <p class="statement__text" data-reveal>We make <span class="ichip">${artSpan('leopard', { mis: false, viewBox: '200 300 400 200' })}</span> artefacts for those who <span class="serif">look back</span> at the dark <span class="ichip">${artSpan('eye', { mis: false, viewBox: '40 760 200 140' })}</span> and find it <span class="serif red">beautiful.</span></p>
        <div class="statement__aside" data-reveal style="--d:.3s">VELOUR GHOST is an independent experimental fashion house. We explore the beautiful, the unsettling and the unknown through wearable art. Every collection is a new investigation. <b>Every garment is an artefact.</b></div>
      </section>
      <section class="index" aria-labelledby="idx-h">
        <div class="sec-head"><h2 class="display" id="idx-h" data-split>The Chapters</h2><p data-reveal>Four investigations into the edges of things. Each chapter has its own language, its own laboratory, its own ghosts — and all of them answer to the same house.</p></div>
        <div class="index__list">${D.chapters.map(c => `<a class="irow" href="#/collection/${c.slug}" data-preview="${c.cover}" data-cursor="ENTER" data-reveal><span class="irow__num">${c.num}</span><span class="irow__title">${esc(c.title)}</span><span class="irow__line">${esc(c.line)}</span><span class="irow__count">${byChapter(c.slug).length} PIECES<br>CH.${c.code}</span></a>`).join('')}</div>
      </section>
      <section class="hs" data-hs aria-labelledby="hs-h">
        <div class="hs__sticky">
          <div class="hs__head"><h2 class="display" id="hs-h">Chapter I — <span class="serif">The Creatures</span></h2><div class="hs__progress" aria-hidden="true"><i></i></div></div>
          <div class="hs__track">
            <div class="hs__intro"><span class="kicker">Six artefacts</span><p class="serif">Mysterious beings, ancient guardians and creatures existing between mythology and the unknown.</p><a class="btn" href="#/collection/the-creatures">View the chapter</a></div>
            ${c1.map((p, i) => `<a class="hsi" href="#/product/${p.slug}" data-cursor="VIEW"><span class="hsi__num" aria-hidden="true">0${i + 1}</span><figure style="margin:0"><div class="hsi__frame">${artDiv(p.art, { label: p.name })}</div><figcaption><b>${esc(p.name)}</b><span>${money(p.price)}</span></figcaption></figure></a>`).join('')}
            <div class="hs__end"><a class="btn" href="#/collections">All four chapters</a></div>
          </div>
        </div>
      </section>
      <section class="feature" aria-labelledby="ft-h">
        <div class="feature__art">${artDiv('specimen', { rough: 1, label: 'Specimen 001 — an unknown organism suspended in a jar' })}</div>
        <div class="feature__copy">
          <span class="kicker">Chapter II — Forbidden Science</span>
          <h2 class="display" id="ft-h" data-split>Specimen<br><span class="phos">001</span></h2>
          <p class="serif" data-reveal>Recovered 1987. Origin unknown. The label on the jar says do not open — and so far, no one has.</p>
          <dl class="label-table" data-reveal><div><dt>Classification</dt><dd>Non-terrestrial</dd></div><div><dt>Limbs</dt><dd>9 — 11 (disputed)</dd></div><div><dt>Status</dt><dd><span class="status" data-s="contained">Contained</span></dd></div><div><dt>Edition</dt><dd>200 pieces</dd></div></dl>
          <div style="display:flex;gap:10px;flex-wrap:wrap" data-reveal><a class="btn btn--solid" href="#/product/specimen-001">View artefact</a><a class="btn" href="#/collection/forbidden-science">Chapter II</a></div>
        </div>
      </section>
      ${marquee(['Restricted', 'Clearance level 3', 'Some records look back', 'Do not open'], 'marquee--red')}
      <section class="ateaser" aria-labelledby="at-h">
        <div class="sec-head"><h2 class="display" id="at-h" data-split>The Archive</h2><p data-reveal>A restricted research collection: creatures, specimens, experiments and studies. ${D.archive.length} records indexed. Some are incomplete. One is missing.</p></div>
        <div class="ateaser__grid">${teaser.map(specCard).join('')}</div>
        <div class="ateaser__cta"><a class="btn" href="#/archive">Request access</a></div>
      </section>
      ${footer()}`
    };
  }

  function collections() {
    return {
      title: 'Collections — VELOUR GHOST', code: 'VG / INDEX OF CHAPTERS',
      desc: 'Four chapters: The Creatures, Forbidden Science, Body of Horror, Experimental Typography.',
      html: `<section class="page-top"><span class="kicker">Index — ${D.chapters.length} chapters / ${D.products.length} artefacts</span>
        <div class="row"><h1 class="display" data-split>Collections</h1><p data-reveal>Each chapter is a separate investigation with its own visual language. Choose a door.</p></div></section>
        <div class="panels">${D.chapters.map(c => `<a class="panel" href="#/collection/${c.slug}" data-cursor="ENTER">${artDiv(c.cover, { label: c.title, pal: c.theme === 'body' ? 'dark' : 'dark' })}<span class="panel__num">${c.num}</span><span class="panel__code">CH.${c.code} — ${byChapter(c.slug).length} PIECES</span><div class="panel__body"><h2 class="display">${esc(c.title)}</h2><p>${esc(c.line)}</p></div></a>`).join('')}</div>
        ${footer()}`
    };
  }

  function chapterNav(c) {
    const i = D.chapters.indexOf(c), prev = D.chapters[(i + D.chapters.length - 1) % D.chapters.length], next = D.chapters[(i + 1) % D.chapters.length];
    return `<nav class="chap-nav" aria-label="Chapters"><a href="#/collection/${prev.slug}"><span class="mono dim">← Chapter ${prev.num}</span><b>${esc(prev.title)}</b></a><a href="#/collection/${next.slug}"><span class="mono dim">Chapter ${next.num} →</span><b>${esc(next.title)}</b></a></nav>`;
  }

  function chapter(slug) {
    const c = CH[slug]; if (!c) return notFound();
    const items = byChapter(slug); let body = '';
    const titleHTML = c.theme === 'type' ? c.title.split(' ').map(w => `<span>${esc(w)}</span>`).join('') : esc(c.title);
    const hero = `<header class="chap-hero">
        <div class="chap-hero__art" data-depth=".12">${artDiv(c.cover, { pal: c.theme === 'body' ? 'paper' : 'dark', rough: 1, label: c.title })}</div>
        <div><p class="chap-hero__num" aria-hidden="true">${c.theme === 'science' ? c.code : c.num}</p><span class="kicker">Chapter ${c.num} — ${items.length} artefacts</span><h1 class="display" data-split>${titleHTML}</h1></div>
        <div class="chap-hero__intro" data-reveal><p>${esc(c.intro)}</p><a class="btn" href="#list">View the artefacts</a></div>
      </header>`;
    if (c.theme === 'creatures') {
      body = `<div class="grid-ed" id="list">${items.map((p, i) => `<a class="ed" href="#/product/${p.slug}" data-cursor="VIEW" data-reveal><span class="ed__no" aria-hidden="true">${['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'][i]}</span>
          <div class="ed__plate">${artDiv(p.art, { label: p.name })}<div class="ed__garment">${garmentDiv(p.slug, 'front', p.colors[0])}</div></div>
          <div class="ed__cap"><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span><p>${esc(p.description.split('. ')[0])}.</p><span class="sub">${p.code} · ${esc(p.garment)} · edition of ${p.edition}</span></div></a>`).join('')}</div>`;
    } else if (c.theme === 'science') {
      body = `<div class="plates" id="list">${items.map((p, i) => `<a class="plate" href="#/product/${p.slug}" data-cursor="EXAMINE" data-reveal style="--d:${(i % 3) * .1}s">
          <div class="plate__top"><span>● ${p.code}</span><span>PLATE ${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}</span></div>
          <div class="plate__view">${artDiv(p.art, { label: p.name })}<div class="plate__g">${garmentDiv(p.slug, 'front', p.colors[0])}</div></div>
          <h3>${esc(p.name)}</h3>
          <dl class="label-table"><div><dt>Form</dt><dd>${esc(p.garment)}</dd></div><div><dt>Edition</dt><dd>${p.edition} pieces</dd></div><div><dt>Value</dt><dd>${money(p.price)}</dd></div></dl></a>`).join('')}</div>`;
    } else if (c.theme === 'body') {
      body = `<div class="theatre" id="list">${items.map((p, i) => `<article class="organ" data-reveal>
          <a class="organ__plate" href="#/product/${p.slug}" data-cursor="VIEW" aria-label="${esc(p.name)}">${artDiv(p.art, { pal: 'paper', label: p.name })}<div class="organ__g">${garmentDiv(p.slug, 'front', p.colors[0])}</div><figcaption><span>Plate ${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span><span>${p.code}</span></figcaption></a>
          <div class="organ__copy"><span class="fig">Fig. ${i + 1}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="meta"><span>${money(p.price)}</span><span>${esc(p.garment)}</span><span>Ed. ${p.edition}</span></div><div><a class="btn" href="#/product/${p.slug}">Examine</a></div></div></article>`).join('')}</div>`;
    } else {
      body = `<div class="trows" id="list">${items.map(p => `<a class="trow" href="#/product/${p.slug}" data-preview="${p.art}" data-cursor="VIEW" data-reveal><span class="trow__name">${esc(p.name)}</span><span class="trow__meta"><b>${p.code}</b><span>${money(p.price)}</span><span>${esc(p.garment)} · ed. ${p.edition}</span></span><span class="trow__thumb">${artDiv(p.art)}</span></a>`).join('')}</div>`;
    }
    return { title: `Chapter ${c.num} — ${c.title} — VELOUR GHOST`, desc: c.line, code: `VG / CH.${c.code} — ${c.title.toUpperCase()}`, html: `<div class="th-${c.theme}">${hero}${body}${chapterNav(c)}</div>${footer()}` };
  }

  const SIZE_CHART = {
    tee: [['Chest (cm)', 52, 55, 58, 61, 64, 67], ['Length (cm)', 66, 68, 70, 72, 74, 76]],
    longsleeve: [['Chest (cm)', 54, 57, 60, 63, 66, 69], ['Length (cm)', 68, 70, 72, 74, 76, 78], ['Sleeve (cm)', 62, 63, 64, 65, 66, 67]],
    hoodie: [['Chest (cm)', 60, 63, 66, 69, 72, 75], ['Length (cm)', 68, 70, 72, 74, 76, 78], ['Sleeve (cm)', 60, 61, 62, 63, 64, 65]],
    jacket: [['Chest (cm)', 58, 61, 64, 67, 70, 73], ['Length (cm)', 68, 70, 72, 74, 76, 78], ['Sleeve (cm)', 61, 62, 63, 64, 65, 66]]
  };
  const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  function product(slug) {
    const p = P[slug]; if (!p) return notFound();
    const c = CH[p.chapter], color = p.colors[0];
    const chart = SIZE_CHART[p.garment];
    const idx = p.sizes.map(s => ALL_SIZES.indexOf(s));
    const lede = p.description.split('. ')[0] + '.';
    const related = byChapter(p.chapter).filter(x => x.slug !== slug).slice(0, 4);
    return {
      title: `${p.name} — ${c.title} — VELOUR GHOST`, desc: p.description, code: `VG / ${p.code}`,
      jsonld: { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.code, description: p.description, brand: { '@type': 'Brand', name: 'VELOUR GHOST' }, offers: { '@type': 'Offer', price: p.price, priceCurrency: D.currency } },
      html: `<article class="pdp" data-pdp="${p.slug}">
        <div class="pdp__gallery" id="pdp-gallery" aria-label="Product images">
          <figure class="pdp__shot pdp__shot--garment pdp__shot--first" data-zoom="0" data-cursor="ZOOM"><div class="art" data-garment="${p.slug}|front|${color}" data-role="front"></div><div class="pdp__alt" aria-hidden="true"><div class="art" data-garment="${p.slug}|back|${color}" data-role="back"></div></div><figcaption>01 — Front<span class="pdp__hint"> · hover for back</span></figcaption><button class="pdp__zoom" type="button" data-zoom-btn="0">Full screen</button></figure>
          <figure class="pdp__shot pdp__shot--garment" data-zoom="1" data-cursor="ZOOM"><div class="art" data-garment="${p.slug}|back|${color}" data-role="back"></div><figcaption>02 — Back</figcaption><button class="pdp__zoom" type="button" data-zoom-btn="1">Full screen</button></figure>
          <figure class="pdp__shot" data-zoom="2" data-cursor="ZOOM"><div class="art" data-detail="${p.slug}|${color}" data-role="detail"></div><figcaption>03 — Print &amp; fabric close-up</figcaption><button class="pdp__zoom" type="button" data-zoom-btn="2">Full screen</button></figure>
          <figure class="pdp__shot pdp__shot--plate" data-zoom="3" data-cursor="ZOOM"><div class="art" data-garment="${p.slug}|plate|${color}"></div><figcaption>04 — The artwork, ${p.code}</figcaption><button class="pdp__zoom" type="button" data-zoom-btn="3">Full screen</button></figure>
        </div>
        <div class="pdp__count" aria-hidden="true"><span id="pdp-idx">01 / 04</span><i><b class="on"></b><b></b><b></b><b></b></i></div>
        <div class="pdp__info">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/collections">Collections</a><span>/</span><a href="#/collection/${c.slug}">Ch. ${c.num} ${esc(c.title)}</a></nav>
          <span class="kicker">${p.code} — Chapter ${c.num}</span>
          <h1 class="display pdp__name" data-split>${esc(p.name)}</h1>
          <p class="pdp__lede">${esc(lede)}</p>
          <div class="pdp__row"><span class="pdp__price">${money(p.price)}</span><span class="pdp__ed">Limited edition of ${p.edition}<br>Ch.${c.code} / ${p.code}</span></div>
          <form id="pdp-form" novalidate>
            <fieldset class="opt"><legend>Colour <b id="pdp-color">${esc(A.FABRIC[color].name)}</b></legend><div class="opt__list">${p.colors.map((k, i) => `<input type="radio" name="color" id="c-${k}" value="${k}" ${i ? '' : 'checked'}><label class="sw" for="c-${k}"><i style="background:${A.FABRIC[k].fabric}"></i>${esc(A.FABRIC[k].name)}</label>`).join('')}</div></fieldset>
            <fieldset class="opt" style="margin-top:22px"><legend>Size <a href="#fit" class="link" data-sizeguide>Size guide</a></legend><div class="opt__list">${p.sizes.map(s => { const out = (p.soldOut || []).includes(s); return `<input type="radio" name="size" id="s-${s}" value="${s}" ${out ? 'disabled' : ''}><label class="sz" for="s-${s}" ${out ? 'title="Sold out"' : ''}>${s}<span class="sr">${out ? ' — sold out' : ''}</span></label>`; }).join('')}</div></fieldset>
            <div class="pdp__add" style="margin-top:26px"><button class="btn btn--solid btn--block" id="pdp-add" type="submit" disabled>Select a size</button><small>Free worldwide shipping over ${money(CFG.shipping.freeOver)} · Duties calculated at checkout</small></div>
          </form>
          <div class="acc">
            <details open><summary>Description</summary><div class="acc__body"><p>${esc(p.description)}</p></div></details>
            <details><summary>Fabric &amp; construction</summary><div class="acc__body"><ul>${p.fabric.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></details>
            <details id="fit"><summary>Fit &amp; sizing</summary><div class="acc__body"><p>${esc(p.fit)}</p>
              <table class="sizes"><caption class="sr">Garment measurements</caption><thead><tr><th scope="col">Measure</th>${p.sizes.map(s => `<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${chart.map(r => `<tr><th scope="row">${r[0]}</th>${idx.map(k => `<td>${r[k + 1]}</td>`).join('')}</tr>`).join('')}</tbody></table>
              <p style="margin-top:12px">Measured flat across the garment. Allow ±1.5cm.</p></div></details>
            <details><summary>Shipping &amp; returns</summary><div class="acc__body"><p>Dispatched in protective archival packaging with a numbered edition card. Free worldwide shipping on orders over ${money(CFG.shipping.freeOver)}. Shipping to ${CFG.shipping.regions.join(', ')}.</p><p><a class="link" href="#/info/shipping">Shipping</a> &nbsp; <a class="link" href="#/info/returns">Returns</a></p></div></details>
            <details><summary>Edition &amp; chapter</summary><div class="acc__body"><ul><li>Chapter ${c.num} — ${esc(c.title)}</li><li>Artefact ${p.code}</li><li>Limited to ${p.edition} pieces. Not restocked once the edition closes.</li><li>Edition number assigned at dispatch.</li></ul></div></details>
          </div>
        </div>
      </article>
      ${related.length ? `<section class="related" aria-labelledby="rel-h"><div class="row" style="display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap"><h2 class="display" id="rel-h" style="font-size:clamp(44px,6vw,100px)" data-split>Also in Chapter ${c.num}</h2><a class="link" href="#/collection/${c.slug}">View chapter</a></div><div class="related__grid">${related.map(x => pcard(x)).join('')}</div></section>` : ''}
      ${footer()}`
    };
  }

  function archive() {
    const groups = [['all', 'All records'], ['00', 'Creatures'], ['01', 'Specimens'], ['02', 'Anatomy'], ['03', 'Typography']];
    const classified = D.archive.filter(r => /classified|sealed/i.test(r.status)).length;
    const missing = D.archive.filter(r => /missing|lost|at large/i.test(r.status)).length;
    return {
      title: 'The Archive — VELOUR GHOST', code: 'VG / ARCHIVE — CLEARANCE REQUIRED', desc: 'A restricted research archive of creatures, specimens, anatomical studies and typographic experiments.',
      html: `<section class="arch-top">
          <h1 class="display" data-split><span class="red">Restricted —</span>The Archive</h1>
          <div class="term" id="term" aria-label="Archive status" data-lines='${JSON.stringify([
            ['', '> VG-ARCHIVE — RESEARCH INSTITUTION OF THE UNKNOWN'],
            ['dim', '> AUTHENTICATING VISITOR .............. GUEST'],
            ['', '> CLEARANCE GRANTED ................... LEVEL 3 (PARTIAL)'],
            ['', `> ${D.archive.length} RECORDS INDEXED. ${classified} CLASSIFIED. ${missing} UNACCOUNTED FOR.`],
            ['warn', '> WARNING: SOME RECORDS LOOK BACK.']
          ]).replace(/'/g, '&#39;')}'></div>
        </section>
        <div class="arch-bar">
          <div class="chips" role="group" aria-label="Filter records">${groups.map(([k, l], i) => `<button class="chip" type="button" data-group="${k}" aria-pressed="${i ? 'false' : 'true'}">${l}</button>`).join('')}</div>
          <div class="arch-filter"><label for="arch-q">QUERY</label><input id="arch-q" type="search" placeholder="Name, origin, status…" autocomplete="off"></div>
          <span class="arch-count" id="arch-count" aria-live="polite"></span>
        </div>
        <div class="arch-grid" id="arch-grid">${D.archive.map(specCard).join('')}<div class="arch-empty" hidden id="arch-empty">No records match. Perhaps they were never filed.</div></div>
        ${footer()}`
    };
  }

  function dossierHTML(r) {
    const i = D.archive.indexOf(r), prev = D.archive[(i + D.archive.length - 1) % D.archive.length], next = D.archive[(i + 1) % D.archive.length];
    const prod = r.product && P[r.product];
    const hud = `<svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#7ED9A0" stroke-width="1" opacity=".75"><path d="M60 100V60H100M740 100V60H700M60 900V940H100M740 900V940H700"/><circle cx="400" cy="500" r="40" stroke-dasharray="4 6"/><path d="M400 430V470M400 530V570M330 500H370M430 500H470"/><rect x="120" y="0" width="560" height="3" fill="#7ED9A0" stroke="none" opacity=".5"><animate attributeName="y" from="60" to="940" dur="4s" repeatCount="indefinite"/></rect></g><g fill="#7ED9A0" font-family="JetBrains Mono, monospace" font-size="14" letter-spacing="2" opacity=".85"><text x="70" y="88">${esc(r.id)}</text><text x="730" y="88" text-anchor="end">REC ●</text><text x="70" y="925">ZOOM 1:1 — ${esc(r.status.toUpperCase())}</text></g><g stroke="#E8E0D2" opacity=".5">${Array.from({ length: 40 }, (_, k) => `<line x1="20" x2="${k % 5 ? 30 : 40}" y1="${100 + k * 20}" y2="${100 + k * 20}"/>`).join('')}</g></svg>`;
    return `<div class="dossier" id="dossier" role="dialog" aria-modal="true" aria-labelledby="dos-h">
      <a class="dossier__close" href="#/archive" aria-label="Close record">Close file ✕</a>
      <div class="dossier__inner">
        <div class="dossier__art">${artDiv(r.art, Object.assign(recOpts(r), { rough: 1 }))}<div class="dossier__hud">${hud}</div></div>
        <div class="dossier__data">
          <span class="kicker">Record ${esc(r.id)} — Clearance level 3</span>
          <h2 class="display" id="dos-h">${esc(r.name)}</h2>
          <dl class="label-table"><div><dt>Specimen no.</dt><dd>${esc(r.id)}</dd></div><div><dt>Classification</dt><dd>${esc(r.classification)}</dd></div><div><dt>Origin</dt><dd>${esc(r.origin)}</dd></div><div><dt>First record</dt><dd>${esc(r.year || '—')}</dd></div><div><dt>Status</dt><dd><span class="status" data-s="${statusKey(r.status)}">${esc(r.status)}</span></dd></div><div><dt>Examiner</dt><dd><span class="redact">REDACTED NAME</span></dd></div></dl>
          <p class="dossier__desc">${esc(r.description)}</p>
          ${prod ? `<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--solid" href="#/product/${prod.slug}">View the artefact — ${money(prod.price)}</a></div>` : `<p class="mono dim">No artefact has been released from this record.</p>`}
          <nav class="dossier__nav" aria-label="Records"><a class="link" href="#/archive/${prev.id}">← ${esc(prev.id)}</a><a class="link" href="#/archive/${next.id}">${esc(next.id)} →</a></nav>
        </div>
      </div></div>`;
  }

  function about() {
    return {
      title: 'About — VELOUR GHOST', code: 'VG / WE ARE NOT HERE TO FIT IN', desc: 'VELOUR GHOST is an independent experimental fashion label operating at the intersection of darkness, art, culture and imagination.',
      html: `<section class="about-hero">${artDiv('zuma', { rough: 1, label: 'Zuma Titan' })}
          <span class="kicker">About the house</span>
          <h1 class="display" data-split><span>We are not</span><span>here to</span><span>fit in.</span></h1></section>
        <section class="about-body">
          <p class="lead" data-reveal>VELOUR GHOST is an independent experimental fashion label operating at the intersection of darkness, art, culture and imagination.</p>
          <p class="lead2" data-reveal>We explore the beautiful, the unsettling and the unknown through wearable art.</p>
          <div class="tenets">
            <div class="tenet" data-reveal><b>01</b><p>Every collection is a new investigation.</p></div>
            <div class="tenet" data-reveal style="--d:.1s"><b>02</b><p>Every garment is an artefact.</p></div>
            <div class="tenet" data-reveal style="--d:.2s"><b>03</b><p>Every chapter reveals something different.</p></div>
          </div>
        </section>
        ${marquee(['Mythology', 'Anatomy', 'The unknown', 'Identity', 'Darkness', 'Beauty'])}
        <section class="sign">${A.mark()}<p data-reveal>Beauty in the shadows,<br>but classy.</p><a class="btn" href="#/collections">Enter the collections</a></section>
        ${footer()}`
    };
  }

  const INFO = {
    shipping: ['Shipping', () => `<div class="notice"><b>Placeholder policy</b>Confirm carriers, timelines and rates before launch. Edit in assets/js/app.js → INFO.</div>
      <h2>Dispatch</h2><p>Each artefact is checked, numbered and packed by hand. Orders typically leave the studio within 3–7 working days.</p>
      <h2>Regions</h2><p>We ship to ${CFG.shipping.regions.join(', ')}.</p>
      <h2>Costs</h2><p>Free worldwide shipping on orders over ${money(CFG.shipping.freeOver)}. Below that, shipping is calculated at checkout. Import duties and taxes may apply depending on your country.</p>`],
    returns: ['Returns', () => `<div class="notice"><b>Placeholder policy</b>Confirm your returns window and conditions before launch.</div>
      <h2>Window</h2><p>Unworn pieces with their edition card and original packaging may be returned within 14 days of delivery.</p>
      <h2>Limited editions</h2><p>Because every edition is finite, exchanges depend on availability. Once an edition closes, it is not remade.</p>
      <h2>How</h2><p>Contact the studio with your order number to begin a return.</p>`],
    privacy: ['Privacy', () => `<div class="notice"><b>Placeholder policy</b>Have this reviewed for your jurisdiction (e.g. NDPR, UK GDPR) before launch.</div>
      <h2>What this site stores</h2><p>Your bag is stored only in your own browser (localStorage). Your sound preference and whether you have passed the opening screen are stored for the current session only. This site sets no tracking cookies.</p>
      <h2>Newsletter</h2><p>If you subscribe, your email address is sent to our mailing provider and used only to send VELOUR GHOST updates.</p>
      <h2>Payments</h2><p>Payments are handled by a third-party payment provider. We never see or store your card details.</p>`],
    terms: ['Terms', () => `<div class="notice"><b>Placeholder terms</b>Replace with your full terms of sale before launch.</div>
      <h2>Artwork</h2><p>All artwork, typography and imagery on this site are original works of VELOUR GHOST and may not be reproduced without permission.</p>
      <h2>Editions</h2><p>Edition sizes are stated on each product page and are final.</p>
      <h2>Pricing</h2><p>Prices are shown in ${D.currency}. Duties and taxes are calculated at checkout.</p>`],
    contact: ['Contact', () => `${CFG.contactEmail ? `<h2>Studio</h2><p><a href="mailto:${esc(CFG.contactEmail)}">${esc(CFG.contactEmail)}</a></p>` : `<div class="notice"><b>Contact address not configured</b>Set <code>contactEmail</code> in assets/js/config.js to publish the studio's address here.</div>`}
      <h2>Elsewhere</h2><p><a href="${esc(CFG.social.instagram)}" target="_blank" rel="noopener">Instagram ↗</a> &nbsp; <a href="${esc(CFG.social.tiktok)}" target="_blank" rel="noopener">TikTok ↗</a></p>
      <h2>Press &amp; collaborations</h2><p>We work with artists, photographers and institutions whose work lives at the edges. Write to us.</p>`]
  };
  function info(page) {
    const d = INFO[page]; if (!d) return notFound();
    return { title: `${d[0]} — VELOUR GHOST`, code: `VG / ${d[0].toUpperCase()}`, html: `<section class="info"><h1 class="display" data-split>${d[0]}</h1><div class="info__body" data-reveal>${d[1]()}</div></section>${footer()}` };
  }

  function notFound() {
    return { title: 'Not found — VELOUR GHOST', code: 'VG / RECORD NOT FOUND', html: `<section class="page-top" style="min-height:80vh;display:grid;align-content:center"><span class="kicker kicker--red">Error 404</span><h1 class="display" data-split>This record<br>does not exist.</h1><p class="serif" style="font-size:24px">Or it was removed before you arrived.</p><div><a class="btn" href="#/">Return to the entrance</a></div></section>${footer()}` };
  }

  /* =======================================================================
     ROUTER
     ======================================================================= */
  const ROUTES = [
    [/^\/?$/, home], [/^\/collections\/?$/, collections], [/^\/collection\/([\w-]+)\/?$/, chapter],
    [/^\/product\/([\w-]+)\/?$/, product], [/^\/archive(?:\/([\w-]+))?\/?$/, archive], [/^\/about\/?$/, about], [/^\/info\/([\w-]+)\/?$/, info]
  ];
  let current = null, first = true, busy = false, pendingAnchor = null;
  const pathOf = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];

  function resolve(path) { for (const [re, fn] of ROUTES) { const m = path.match(re); if (m) return { fn, arg: m[1], m }; } return { fn: notFound }; }

  async function route() {
    const path = pathOf();
    // in-page anchors (#list, #fit) — handled without routing
    if (!path.startsWith('/')) { const t = document.getElementById(path); if (t) { if (t.tagName === 'DETAILS') t.open = true; t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); } if (current) history.replaceState(null, '', '#' + current.path); return; }
    const r = resolve(path);
    // archive ↔ dossier without a full transition
    if (current && current.fn === archive && r.fn === archive) { setDossier(r.arg); current.path = path; return; }
    if (busy) return; busy = true;
    closeAll();
    const view = r.fn(r.arg);
    if (!first) { await veilIn(view.code); }
    mount(view, r, path);
    if (!first) await veilOut();
    first = false; busy = false;
    if (pathOf() !== path) route();
  }

  function mount(view, r, path) {
    main.innerHTML = view.html;
    document.title = view.title;
    const md = $('meta[name="description"]'); if (view.desc) md.setAttribute('content', view.desc);
    $$('script[data-route-ld]').forEach(s => s.remove());
    if (view.jsonld) { const s = document.createElement('script'); s.type = 'application/ld+json'; s.dataset.routeLd = '1'; s.textContent = JSON.stringify(view.jsonld); document.head.appendChild(s); }
    window.scrollTo(0, 0);
    current = { fn: r.fn, path };
    const seg = path.split('/')[1] || '';
    $$('.hdr__nav a').forEach(a => a.classList.toggle('is-active', (seg === 'collection' || seg === 'product' ? 'collections' : seg) === a.dataset.nav));
    enhance(main);
    if (r.fn === product) initProduct(r.arg);
    if (r.fn === archive) { initArchive(); setDossier(r.arg); }
    if (!first) main.focus({ preventScroll: true });
  }

  const veil = $('#veil');
  async function veilIn(code) {
    if (reduced) return;
    $('#veil-code').textContent = code || 'VG / LOADING';
    veil.classList.remove('is-out'); void veil.offsetWidth; veil.classList.add('is-in');
    AU.chime();
    await wait(720);
  }
  async function veilOut() {
    if (reduced) return;
    veil.classList.add('is-out'); await wait(800); veil.classList.remove('is-in', 'is-out');
  }

  /* =======================================================================
     ENHANCEMENTS
     ======================================================================= */
  let parallax = [], hsList = [], mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 }) : null;

  function split(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            for (const ch of part) { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = ch; w.appendChild(s); }
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
  }

  function enhance(root) {
    lazyArt(root);
    $$('[data-split]', root).forEach(split);
    const targets = $$('[data-reveal], [data-split]', root);
    entered.then(() => targets.forEach(t => revealIO ? revealIO.observe(t) : t.classList.add('is-in')));
    parallax = $$('[data-depth], [data-mouse]', root);
    hsList = $$('[data-hs]', root).map(sec => ({ sec, track: $('.hs__track', sec), bar: $('.hs__progress i', sec) }));
    layoutHS();
    if (fine && !reduced) $$('[data-tilt]', root).forEach(tilt);
    if (fine) $$('[data-preview]', root).forEach(previewHover);
    $$('[data-newsletter]', root).forEach(f => f.addEventListener('submit', newsletter));
    const term = $('#term', root); if (term) typeTerm(term);
    onScroll();
  }

  function layoutHS() {
    hsList.forEach(h => {
      if (isMobile()) { h.sec.style.height = ''; h.track.style.transform = ''; return; }
      const dist = Math.max(0, h.track.scrollWidth - innerWidth);
      h.dist = dist; h.sec.style.height = (dist + innerHeight) + 'px';
    });
  }

  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    parallax.forEach(el => {
      const d = parseFloat(el.dataset.depth || 0), m = parseFloat(el.dataset.mouse || 0);
      if (y > innerHeight * 1.6 && !m) return;
      el.style.transform = `translate3d(${n2(mouse.x * m)}px, ${n2(y * d + mouse.y * m)}px, 0)`;
    });
    hsList.forEach(h => {
      if (isMobile() || !h.dist) return;
      const top = h.sec.offsetTop, prog = clamp((y - top) / (h.sec.offsetHeight - innerHeight), 0, 1);
      h.track.style.transform = `translate3d(${-prog * h.dist}px,0,0)`;
      if (h.bar) h.bar.style.transform = `scaleX(${prog})`;
    });
    const hdr = $('#hdr');
    if (y > 240 && y > lastY + 4) hdr.classList.add('is-hidden'); else if (y < lastY - 4 || y < 240) hdr.classList.remove('is-hidden');
    lastY = y;
  }
  const n2 = v => Math.round(v * 100) / 100;
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', () => { layoutHS(); onScroll(); });

  function tilt(card) {
    card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`; });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  }

  const pv = $('#preview'); const pvCache = {};
  function previewHover(el) {
    el.addEventListener('mouseenter', () => { const k = el.dataset.preview; pv.innerHTML = pvCache[k] || (pvCache[k] = A.render(k, { label: k })); pv.classList.add('is-on'); });
    el.addEventListener('mouseleave', () => pv.classList.remove('is-on'));
    el.addEventListener('mousemove', e => { pv.style.left = clamp(e.clientX + 40, 0, innerWidth - 300) + 'px'; pv.style.top = clamp(e.clientY - 180, 10, innerHeight - 360) + 'px'; });
  }

  function typeTerm(el) {
    const lines = JSON.parse(el.dataset.lines); el.innerHTML = '';
    let li = 0;
    const next = () => {
      if (li >= lines.length) { el.insertAdjacentHTML('beforeend', '<span class="term__cur"></span>'); return; }
      const [cls, text] = lines[li++]; const s = document.createElement('span'); if (cls) s.className = cls; el.appendChild(s);
      if (reduced) { s.textContent = text; next(); return; }
      let k = 0; const t = setInterval(() => { s.textContent = text.slice(0, k += 2); if (k >= text.length) { clearInterval(t); setTimeout(next, 180); } }, 16);
    };
    entered.then(() => setTimeout(next, 500));
  }

  /* ---------- product page ---------- */
  function initProduct(slug) {
    const p = P[slug], form = $('#pdp-form'), add = $('#pdp-add');
    let color = p.colors[0], size = null;
    form.addEventListener('change', e => {
      if (e.target.name === 'color') {
        color = e.target.value; $('#pdp-color').textContent = A.FABRIC[color].name;
        $$('#pdp-gallery [data-garment]').forEach(el => { const [s, side] = el.dataset.garment.split('|'); repaint(el, 'garment', `${s}|${side}|${color}`); });
        $$('#pdp-gallery [data-detail]').forEach(el => repaint(el, 'detail', `${slug}|${color}`));
      }
      if (e.target.name === 'size') { size = e.target.value; add.disabled = false; add.textContent = `Add to bag — ${money(p.price)}`; }
    });
    form.addEventListener('submit', e => { e.preventDefault(); if (!size) return; addToBag(slug, color, size); toast(`${p.name} · ${size} — added to bag`); openOverlay('bag'); });
    $('[data-sizeguide]').addEventListener('click', e => { e.preventDefault(); const f = $('#fit'); f.open = true; f.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); });
    const gal = $('#pdp-gallery');
    gal.addEventListener('click', e => { const f = e.target.closest('[data-zoom]'); if (f) openLightbox(slug, color, +f.dataset.zoom); });
    gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); $('#pdp-idx').textContent = `0${i + 1} / 04`; $$('.pdp__count i b').forEach((b, k) => b.classList.toggle('on', k === i)); }, { passive: true });
  }

  /* ---------- lightbox ---------- */
  let lb = null;
  function openLightbox(slug, color, i) {
    const p = P[slug];
    const shots = [['garment', 'front'], ['garment', 'back'], ['detail'], ['garment', 'plate']];
    lb = { slug, color, i, shots };
    const show = () => {
      const [t, side] = shots[lb.i];
      const st = $('#lightbox-stage'); $('#lightbox').classList.remove('is-zoomed');
      st.innerHTML = `<div>${t === 'detail' ? `<div class="art" style="width:100%;height:100%;background:transparent" data-detail="${slug}|${color}"></div>` : `<div class="art" style="width:100%;height:100%;background:transparent" data-garment="${slug}|${side}|${color}"></div>`}</div>`;
      paint($('.art', st)); $('#lightbox-count').textContent = `0${lb.i + 1} / 0${shots.length} — ${p.name.toUpperCase()}`;
    };
    lb.show = show; show(); openOverlay('lightbox');
  }
  $('#lightbox-prev').addEventListener('click', () => { lb.i = (lb.i + 3) % 4; lb.show(); });
  $('#lightbox-next').addEventListener('click', () => { lb.i = (lb.i + 1) % 4; lb.show(); });
  $('#lightbox-stage').addEventListener('click', e => { const box = $('#lightbox'); const inner = $('#lightbox-stage > div'); if (!inner) return; const r = inner.getBoundingClientRect(); inner.style.setProperty('--ox', ((e.clientX - r.left) / r.width * 100) + '%'); inner.style.setProperty('--oy', ((e.clientY - r.top) / r.height * 100) + '%'); box.classList.toggle('is-zoomed'); });

  /* ---------- archive ---------- */
  function initArchive() {
    const grid = $('#arch-grid'), q = $('#arch-q'), count = $('#arch-count'); let group = 'all';
    const apply = () => {
      const t = q.value.trim().toLowerCase(); let shown = 0;
      $$('.spec', grid).forEach(c => { const ok = (group === 'all' || c.dataset.group === group) && (!t || c.dataset.search.includes(t)); c.hidden = !ok; if (ok) { shown++; c.classList.add('is-in'); } });
      count.textContent = `SHOWING ${shown} / ${D.archive.length} RECORDS`; $('#arch-empty').hidden = shown > 0;
    };
    $$('.chip').forEach(b => b.addEventListener('click', () => { group = b.dataset.group; $$('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); apply(); }));
    q.addEventListener('input', apply); apply();
  }
  let dossierReturn = null;
  function setDossier(id) {
    const old = $('#dossier'); if (old) old.remove();
    const r = id && D.archive.find(a => a.id.toLowerCase() === id.toLowerCase());
    if (!r) { document.body.classList.remove('lock'); if (dossierReturn) { dossierReturn.focus({ preventScroll: true }); dossierReturn = null; } return; }
    if (!dossierReturn) dossierReturn = document.activeElement;
    document.body.insertAdjacentHTML('beforeend', dossierHTML(r));
    const d = $('#dossier'); lazyArt(d); $$('.art', d).forEach(paint); document.body.classList.add('lock');
    $('.dossier__close', d).focus();
    document.title = `${r.id} — ${r.name} — The Archive — VELOUR GHOST`;
  }

  /* =======================================================================
     OVERLAYS (menu, search, bag, lightbox)
     ======================================================================= */
  let openId = null, lastFocus = null;
  function openOverlay(id) {
    if (openId && openId !== id) closeOverlay(true);
    const el = $('#' + id); if (!el) return;
    lastFocus = document.activeElement; openId = id;
    el.hidden = false; document.body.classList.add('lock');
    $$(`[data-open="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
    if (id === 'bag') renderBag();
    if (id === 'search') { renderSearch(''); setTimeout(() => $('#search-input').focus(), 30); }
    else { const f = el.querySelector('a[href], button:not([disabled]), input'); f && f.focus(); }
  }
  function closeOverlay(silent) {
    if (!openId) return; const el = $('#' + openId); el.hidden = true;
    $$(`[data-open="${openId}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    openId = null; if (!$('#dossier')) document.body.classList.remove('lock');
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function closeAll() { closeOverlay(true); const d = $('#dossier'); if (d) d.remove(); dossierReturn = null; document.body.classList.remove('lock'); }

  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); const id = o.dataset.open; openId === id ? closeOverlay() : openOverlay(id); return; }
    const c = e.target.closest('[data-close]'); if (c) { if (c.tagName !== 'A') e.preventDefault(); closeOverlay(c.tagName === 'A'); return; }
    if (e.target.closest('[data-sound]')) { AU.toggle(); return; }
    const q = e.target.closest('[data-qty]'); if (q) { const [k, d] = q.dataset.qty.split('|').map(Number); bag[k].qty = clamp(bag[k].qty + d, 1, 5); saveBag(); return; }
    const rm = e.target.closest('[data-remove]'); if (rm) { bag.splice(+rm.dataset.remove, 1); saveBag(); return; }
    if (e.target.closest('#checkout')) { checkout(); return; }
    if (e.target.closest('.search__hints button')) { const v = e.target.closest('button').textContent; $('#search-input').value = v; renderSearch(v); return; }
    const a = e.target.closest('a[href^="#"]'); if (a && openId && a.getAttribute('href').startsWith('#/')) closeOverlay(true);
    if (a && a.getAttribute('href') === location.hash && a.getAttribute('href').startsWith('#/')) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (openId) { closeOverlay(); return; }
      if ($('#dossier')) { location.hash = '#/archive'; return; }
    }
    if (e.key === 'Tab') {
      const box = openId ? $('#' + openId) : $('#dossier') || (!html.classList.contains('entered') ? $('#gate') : null);
      if (!box) return;
      const f = $$('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex="0"]', box).filter(x => x.offsetParent !== null || x === document.activeElement);
      if (!f.length) return; const firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && html.classList.contains('entered')) { e.preventDefault(); openOverlay('search'); }
    if (lb && openId === 'lightbox') { if (e.key === 'ArrowRight') $('#lightbox-next').click(); if (e.key === 'ArrowLeft') $('#lightbox-prev').click(); }
  });

  /* ---------- search ---------- */
  const INDEX = [
    ...D.products.map(p => ({ type: 'Artefact', title: p.name, sub: `${p.code} · Ch. ${CH[p.chapter].num} ${CH[p.chapter].title} · ${money(p.price)}`, href: `#/product/${p.slug}`, art: p.art, hay: [p.name, p.code, p.garment, p.description, CH[p.chapter].title, p.art].join(' ').toLowerCase() })),
    ...D.archive.map(r => ({ type: 'Record', title: r.name, sub: `${r.id} · ${r.classification} · ${r.status}`, href: `#/archive/${r.id}`, art: r.art, opts: recOpts(r), hay: [r.name, r.id, r.classification, r.origin, r.status, r.description].join(' ').toLowerCase() })),
    ...D.chapters.map(c => ({ type: 'Chapter', title: `Chapter ${c.num} — ${c.title}`, sub: c.line, href: `#/collection/${c.slug}`, art: c.cover, hay: [c.title, c.line, c.intro, 'chapter ' + c.num].join(' ').toLowerCase() }))
  ];
  function renderSearch(q) {
    const box = $('#search-results'); q = q.trim().toLowerCase();
    if (!q) { box.innerHTML = `<p class="search__empty">Try:</p><div class="search__hints">${['Masquerade', 'Specimen', 'Heart', 'Hoodie', 'Contained', 'Leopard', 'Signal'].map(t => `<button type="button">${t}</button>`).join('')}</div>`; return; }
    const terms = q.split(/\s+/);
    const res = INDEX.map(it => ({ it, s: terms.every(t => it.hay.includes(t)) ? (it.title.toLowerCase().includes(q) ? 2 : 1) : 0 })).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 14);
    box.innerHTML = res.length ? res.map(({ it }) => `<a class="sres" href="${it.href}"><span class="sres__img">${artDiv(it.art, Object.assign({ mis: false }, it.opts || {}))}</span><span><h3>${esc(it.title)}</h3><p>${esc(it.sub)}</p></span><span class="sres__type">${it.type}</span></a>`).join('')
      : `<p class="search__empty">No results for “${esc(q)}”. Nothing in the archive answers to that name.</p>`;
    lazyArt(box);
  }
  let sTimer; $('#search-input').addEventListener('input', e => { clearTimeout(sTimer); sTimer = setTimeout(() => renderSearch(e.target.value), 120); });
  $('#search-form').addEventListener('submit', e => { e.preventDefault(); const f = $('#search-results a'); if (f) { location.hash = f.getAttribute('href'); closeOverlay(true); } });

  /* ---------- newsletter ---------- */
  async function newsletter(e) {
    e.preventDefault();
    const form = e.target, input = form.querySelector('input'), msg = form.parentElement.querySelector('.news__msg'), v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.innerHTML = `<div class="notice"><b>Invalid address</b>Please enter a valid email address.</div>`; input.focus(); return; }
    if (!CFG.newsletter || !CFG.newsletter.endpoint) { msg.innerHTML = `<div class="notice"><b>Newsletter not yet connected</b>Sign-ups aren't live yet, so your address was not stored or sent anywhere.</div>`; return; }
    try {
      const res = await fetch(CFG.newsletter.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: v }) });
      if (!res.ok) throw 0;
      msg.innerHTML = `<div class="notice notice--ok"><b>You are on the list</b>Watch the dark. We'll be in touch when the next chapter opens.</div>`; form.reset();
    } catch (err) { msg.innerHTML = `<div class="notice"><b>Couldn't subscribe</b>The mailing service didn't respond. Please try again later.</div>`; }
  }

  /* ---------- toast ---------- */
  let tT; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('is-on'); clearTimeout(tT); tT = setTimeout(() => el.classList.remove('is-on'), 2600); }

  /* ---------- sound UI ---------- */
  document.addEventListener('vg:sound', e => { const on = e.detail.on; $$('[data-sound]').forEach(b => { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', `Atmospheric sound: ${on ? 'on' : 'off'}`); const l = b.querySelector('.tool__label'); if (l) l.textContent = on ? 'Sound on' : 'Sound off'; }); });

  /* ---------- cursor ---------- */
  if (fine && !reduced) {
    html.classList.add('has-cursor');
    const cur = $('#cursor'), ring = $('.cursor__ring', cur), dot = $('.cursor__dot', cur), label = $('.cursor__label', cur);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; mouse.tx = (x / innerWidth - .5); mouse.ty = (y / innerHeight - .5); }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('is-down')); addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]'); const l = e.target.closest('a, button, label, summary, input, [role="button"]');
      cur.classList.toggle('is-view', !!v); cur.classList.toggle('is-link', !!l && !v); label.textContent = v ? v.dataset.cursor : '';
    });
    document.addEventListener('mouseleave', () => cur.style.opacity = 0); document.addEventListener('mouseenter', () => cur.style.opacity = 1);
    (function loop() {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      dot.style.transform = `translate(${x}px,${y}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`;
      label.style.left = rx + 'px'; label.style.top = ry + 'px';
      mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;
      if (parallax.length && scrollY < innerHeight * 1.5) onScroll();
      requestAnimationFrame(loop);
    })();
  }

  /* =======================================================================
     OPENING GATE
     ======================================================================= */
  function gate() {
    const g = $('#gate');
    const done = () => { html.classList.add('entered'); document.body.classList.remove('lock'); enteredResolve(); };
    $('#gate-mark').innerHTML = A.mark({ blur: 4 });
    $('.gate__o').innerHTML = A.mark({ blur: 3 });
    if (html.classList.contains('entered')) { done(); return; }
    document.body.classList.add('lock');
    const clock = () => { const d = new Date(); $('#gate-clock').textContent = d.toTimeString().slice(0, 8); }; clock(); const ci = setInterval(clock, 1000);
    const msgs = ['ESTABLISHING CONNECTION', 'DECRYPTING ARCHIVE', 'LOADING SPECIMENS', 'CALIBRATING DARKNESS', 'ACCESS GRANTED'];
    const dur = reduced ? 200 : 1900, t0 = performance.now();
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    let fontsOk = false; fontsReady.then(() => fontsOk = true); setTimeout(() => fontsOk = true, 3500);
    (function tick(now) {
      const k = clamp((now - t0) / dur, 0, fontsOk ? 1 : .94);
      $('#gate-count').textContent = String(Math.floor(k * 100)).padStart(3, '0');
      $('#gate-bar').style.transform = `scaleX(${k})`;
      $('#gate-status').textContent = msgs[Math.min(msgs.length - 1, Math.floor(k * msgs.length))];
      if (k < 1) requestAnimationFrame(tick); else { g.classList.add('is-ready'); setTimeout(() => $('#gate-enter').focus({ preventScroll: true }), 50); }
    })(t0);
    const enter = withSound => {
      if (g.classList.contains('is-opening')) return;
      if (withSound) AU.start();
      try { sessionStorage.setItem('vg-entered', '1'); } catch (e) { }
      g.classList.add('is-opening');
      setTimeout(() => { g.classList.add('is-gone'); done(); }, reduced ? 10 : 1250);
      setTimeout(() => { g.hidden = true; clearInterval(ci); }, reduced ? 20 : 2200);
    };
    $('#gate-enter').addEventListener('click', () => enter(false));
    $('#gate-enter-sound').addEventListener('click', () => enter(true));
    g.addEventListener('keydown', e => { if (e.key === 'Escape') enter(false); });
  }

  /* ---------- boot ---------- */
  function boot() {
    $('.hdr__logo').innerHTML = logoHTML();
    $('#menu-chapters').innerHTML = `<span class="kicker">Chapters</span>` + D.chapters.map(c => `<a href="#/collection/${c.slug}"><b>${c.num}</b><span>${esc(c.title)}</span></a>`).join('');
    updateBagUI();
    gate();
    addEventListener('hashchange', route);
    route();
    try { if (sessionStorage.getItem('vg-sound') === '1') document.addEventListener('pointerdown', function once() { AU.start(); document.removeEventListener('pointerdown', once); }); } catch (e) { }
  }
  boot();
})();
