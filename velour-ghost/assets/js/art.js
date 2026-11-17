/* =========================================================================
   VELOUR GHOST — ART ENGINE
   Every image on this site is drawn here as original engraved SVG artwork.
   No stock photography. Each piece is seeded, so it renders identically
   every time. Swap in real photography per product via catalog.js `images`.
   ========================================================================= */
(function () {
  'use strict';

  const BONE = '#E8E0D2', BLACK = '#050505', WASH = '#111111', RED = '#8B1018', GREEN = '#7ED9A0';

  const PALETTES = {
    dark:  { bg: BLACK, fill: BLACK, ink: BONE, red: RED, green: GREEN, glow: true },
    wash:  { bg: WASH, fill: WASH, ink: BONE, red: RED, green: GREEN, glow: true },
    paper: { bg: BONE, fill: BONE, ink: '#17110f', red: RED, green: '#2d6e4a', glow: false }
  };

  let UID = 0;
  const n = v => Math.round(v * 10) / 10;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function seedOf(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* ---------- primitives ---------- */
  const L = (x1, y1, x2, y2, a = '') => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${a}/>`;
  const P = (d, a = '') => `<path d="${d}" ${a}/>`;
  const C = (cx, cy, r, a = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${a}/>`;
  const E = (cx, cy, rx, ry, a = '') => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${a}/>`;
  const T = (x, y, s, a = '') => `<text x="${n(x)}" y="${n(y)}" ${a}>${esc(s)}</text>`;
  const MONO = `font-family="'JetBrains Mono',ui-monospace,monospace"`;
  const GROT = `font-family="Archivo,'Arial Narrow',sans-serif"`;

  function poly(pts, close = true) { return 'M' + pts.map(q => n(q[0]) + ' ' + n(q[1])).join('L') + (close ? 'Z' : ''); }
  function smooth(pts, closed = false, t = 1) {
    const N = pts.length; if (N < 2) return '';
    const get = i => closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))];
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    const end = closed ? N : N - 1;
    for (let i = 0; i < end; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += `C${n(p1[0] + (p2[0] - p0[0]) / 6 * t)} ${n(p1[1] + (p2[1] - p0[1]) / 6 * t)} ${n(p2[0] - (p3[0] - p1[0]) / 6 * t)} ${n(p2[1] - (p3[1] - p1[1]) / 6 * t)} ${n(p2[0])} ${n(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }
  function mirror(right, cx = 400) { return right.concat(right.slice(1, -1).reverse().map(([x, y]) => [2 * cx - x, y])); }
  function scaleAbout(pts, cx, cy, s, sy = s) { return pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * sy]); }
  function contours(pts, cx, cy, count, minS, attr, sy) {
    let o = '';
    for (let i = 1; i < count; i++) {
      const s = 1 - (1 - minS) * i / (count - 1);
      o += P(smooth(scaleAbout(pts, cx, cy, s, sy ? 1 - (1 - sy) * i / (count - 1) : s), true), attr);
    }
    return o;
  }
  function blob(cx, cy, r0, k, r, amp = .22) {
    const pts = []; const ph = r() * 6;
    for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2; const rr = r0 * (1 + Math.sin(a * 3 + ph) * amp * .5 + (r() - .5) * amp); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return pts;
  }
  function branch(r, x, y, ang, len, depth, w, attr, out) {
    if (depth <= 0 || len < 3) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const mx = (x + x2) / 2 + (r() - .5) * len * .3, my = (y + y2) / 2 + (r() - .5) * len * .3;
    out.push(`<path d="M${n(x)} ${n(y)}Q${n(mx)} ${n(my)} ${n(x2)} ${n(y2)}" stroke-width="${n(Math.max(.35, w))}" ${attr}/>`);
    const k = r() < .8 ? 2 : 3;
    for (let i = 0; i < k; i++) branch(r, x2, y2, ang + (i - (k - 1) / 2) * (.35 + r() * .45) + (r() - .5) * .3, len * (.62 + r() * .2), depth - 1, w * .68, attr, out);
  }
  const pupil = (x, y, rx, ry, pal, extra = '') =>
    `<g class="vg-eye" ${pal.glow ? `filter="url(#__P__glow)"` : ''}>${E(x, y, rx, ry, `fill="${pal.green}" ${extra}`)}</g>`;

  function defs(p, pal) {
    const bg = pal.bg || pal.fill || BLACK;
    return `<filter id="${p}rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="2.4"/></filter>
<filter id="${p}glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="${p}red" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0 0 0 0 .545  0 0 0 0 .063  0 0 0 0 .094  0 0 0 .55 0"/></filter>
<filter id="${p}xerox" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="11" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.35" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
<pattern id="${p}h1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="5" stroke="${pal.ink}" stroke-width=".8"/></pattern>
<pattern id="${p}h2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><line x1="0" y1="0" x2="0" y2="4" stroke="${pal.ink}" stroke-width=".7"/></pattern>
<pattern id="${p}hb" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="5" stroke="${bg}" stroke-width="1.6"/></pattern>
<pattern id="${p}dot" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="3.5" cy="3.5" r="1.4" fill="${pal.ink}"/></pattern>
<pattern id="${p}grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${pal.ink}" stroke-width=".5"/></pattern>
<radialGradient id="${p}spot" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="${pal.ink}" stop-opacity=".07"/><stop offset="1" stop-color="${pal.ink}" stop-opacity="0"/></radialGradient>
<radialGradient id="${p}vig" cx="50%" cy="45%" r="75%"><stop offset=".62" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${bg}" stop-opacity=".95"/></radialGradient>
<linearGradient id="${p}fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${bg}" stop-opacity="1"/></linearGradient>
<radialGradient id="${p}gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${pal.green}" stop-opacity=".55"/><stop offset="1" stop-color="${pal.green}" stop-opacity="0"/></radialGradient>`;
  }

  /* =======================================================================
     CHAPTER I — THE CREATURES
     ======================================================================= */
  const ART = {};

  ART.masquerade = ({ p, pal, r, o }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += E(400, 360, 360, 470, `fill="url(#${p}spot)"`);
    // drifting motes
    for (let i = 0; i < 70; i++) s += C(r() * 800, r() * 1000, r() * 1.3 + .3, `fill="${I}" opacity="${n(r() * .5)}"`);
    // crown of quills
    const Q = o.dense ? 64 : 46;
    for (let i = 0; i < Q; i++) {
      const t = i / (Q - 1) - .5, a = -Math.PI / 2 + t * 2.5;
      const len = 120 + r() * 190 * (1 - Math.abs(t) * 1.1);
      const x1 = 400 + Math.cos(a) * 60, y1 = 270 + Math.sin(a) * 115;
      const x2 = 400 + Math.cos(a) * (60 + len), y2 = 270 + Math.sin(a) * (115 + len * .95);
      s += L(x1, y1, x2, y2, `stroke="${I}" stroke-width="${n(.5 + r() * 1.1)}" opacity="${n(.3 + r() * .65)}"`);
      if (r() < .75) s += C(x2, y2, 1.4 + r() * 2.6, `fill="${r() < .14 ? pal.red : I}"`);
      if (r() < .35) { const k = .55 + r() * .3; s += C(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, 1.6, `fill="none" stroke="${I}" stroke-width=".6"`); }
    }
    // body of strands
    const N = o.dense ? 300 : 190;
    const halfW = y => 230 + (y - 540) / 460 * 150;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1); const x0 = 170 + 460 * t + (r() - .5) * 4;
      const y0 = 545 + Math.pow((x0 - 400) / 230, 2) * 46 + r() * 6;
      const x1 = 400 + (x0 - 400) * 1.62 + (r() - .5) * 26, y1 = 1010 + r() * 30;
      const mx = (x0 + x1) / 2 + (r() - .5) * 34, my = (y0 + y1) / 2;
      const col = r() < .05 ? pal.red : I;
      s += P(`M${n(x0)} ${n(y0)}Q${n(mx)} ${n(my)} ${n(x1)} ${n(y1)}`, `fill="none" stroke="${col}" stroke-width="${n(.45 + r() * 1.2)}" opacity="${n(.22 + r() * .72)}"`);
    }
    // woven tiers
    [640, 735, 830, 925].forEach((y, k) => {
      const w = halfW(y), pts = [];
      for (let x = 400 - w; x <= 400 + w; x += 9) pts.push([x, y + Math.sin(x * .09) * 3 + (r() - .5) * 3]);
      s += P(poly(pts, false), `fill="none" stroke="${k === 1 ? pal.red : I}" stroke-width="${k === 1 ? 2.4 : 1.3}" opacity=".9"`);
      for (let x = 400 - w + 6; x < 400 + w; x += 18) s += C(x, y + 8, 2.2, `fill="${k === 1 ? pal.red : I}" opacity=".85"`);
    });
    // elongated hands emerging from the fringe
    [-1, 1].forEach(side => {
      const bx = 400 + side * 228, by = 700;
      for (let f = 0; f < 4; f++) {
        let x = bx, y = by + f * 9, a = Math.PI / 2 + side * (-.55 + f * .2);
        const pts = [[x, y]];
        for (let j = 0; j < 4; j++) { const len = 34 - j * 4 + (f === 1 ? 6 : 0); a += side * -.12; x += Math.cos(a) * len * 1.0 * side * -1 * -1; y += Math.sin(a) * len; pts.push([x, y]); }
        s += P(poly(pts, false), `fill="none" stroke="${I}" stroke-width="1.6" stroke-linecap="round" opacity=".9"`);
        pts.slice(1, -1).forEach(q => s += C(q[0], q[1], 1.8, `fill="${F}" stroke="${I}" stroke-width=".8"`));
      }
    });
    // neck rings
    for (let i = 0; i < 6; i++) s += E(400, 486 + i * 10, 64 - i * 1.5, 10, `fill="${F}" stroke="${I}" stroke-width="1.1"`);
    // the mask
    const mask = mirror([[400, 126], [446, 138], [480, 178], [494, 240], [492, 302], [478, 362], [454, 418], [426, 458], [400, 482]]);
    s += P(smooth(mask, true), `fill="${F}" stroke="${I}" stroke-width="2"`);
    s += contours(mask, 400, 300, o.dense ? 20 : 15, .2, `fill="none" stroke="${I}" stroke-width=".7" opacity=".55"`, .12);
    // eye band (shadow)
    s += P(`M312 262Q400 236 488 262L486 304Q400 284 314 304Z`, `fill="${F}" opacity=".92"`);
    s += P(`M312 262Q400 236 488 262L486 304Q400 284 314 304Z`, `fill="url(#${p}h2)" opacity=".5"`);
    // ridge
    s += L(400, 150, 400, 410, `stroke="${I}" stroke-width="2.4"`);
    // eyes
    [352, 448].forEach((x, k) => {
      const d = k ? 1 : -1;
      s += P(`M${x - 36 * d} ${288}Q${x} ${262} ${x + 34 * d} ${276}Q${x} ${298} ${x - 36 * d} 288Z`, `fill="${BLACK}" stroke="${I}" stroke-width="1.4"`);
      s += pupil(x, 282, 2.4, 9, pal);
    });
    // scarification
    [-1, 1].forEach(sd => { for (let k = 0; k < 4; k++) s += P(`M${400 + sd * 50} ${330 + k * 11}q${sd * 18} -4 ${sd * 34} 2`, `fill="none" stroke="${I}" stroke-width="1.6"`); });
    for (let k = -5; k <= 5; k++) s += C(400 + k * 13, 196 + Math.abs(k) * k * 0 + k * k * .9, 2.2, `fill="${k === 0 ? pal.red : I}"`);
    // mouth
    s += `<rect x="382" y="420" width="36" height="7" fill="${BLACK}" stroke="${I}" stroke-width="1"/>` + L(386, 423.5, 414, 423.5, `stroke="${pal.red}" stroke-width="1.6"`);
    if (pal.bg) s += `<rect y="600" width="800" height="400" fill="url(#${p}fade)"/>`;
    return s;
  };

  ART.coil = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill, cx = 400, cy = 520; let s = '';
    if (pal.bg) s += C(cx, cy, 420, `fill="url(#${p}spot)"`);
    for (let i = 0; i < 7; i++) s += C(cx, cy, 392 - i * 7, `fill="none" stroke="${I}" stroke-width=".6" opacity="${n(.08 + i * .03)}" ${i % 2 ? 'stroke-dasharray="2 5"' : ''}`);
    const K = 440, turns = 4.3, a0 = .3;
    const pt = t => { const a = a0 + t * turns * Math.PI * 2, rad = 40 + t * 292; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, a]; };
    const inner = [], outer = [];
    for (let k = 0; k <= K; k++) {
      const t = k / K, [x, y, a] = pt(t), th = 6 + t * 56;
      const ix = x - Math.cos(a) * th / 2, iy = y - Math.sin(a) * th / 2, ox = x + Math.cos(a) * th / 2, oy = y + Math.sin(a) * th / 2;
      inner.push([ix, iy]); outer.push([ox, oy]);
    }
    s += P(poly(outer.concat(inner.slice().reverse())), `fill="${F}"`);
    for (let k = 0; k <= K; k += 1) {
      const band = (k % 36) < 3 && k > 40;
      s += L(inner[k][0], inner[k][1], outer[k][0], outer[k][1], `stroke="${band ? pal.red : I}" stroke-width="${band ? 1.6 : .7}" opacity="${band ? .95 : n(.35 + (k % 2) * .4)}"`);
      if (k % 7 === 0 && k > 20) { const [ox, oy] = outer[k]; const a = pt(k / K)[2]; s += C(ox + Math.cos(a) * 6, oy + Math.sin(a) * 6, 1.8 + (k / K) * 1.6, `fill="${I}" opacity=".85"`); }
    }
    s += P(poly(outer, false), `fill="none" stroke="${I}" stroke-width="1.6"`) + P(poly(inner, false), `fill="none" stroke="${I}" stroke-width="1.2"`);
    // head
    const [hx, hy] = pt(1), [px, py] = pt(.985); const deg = Math.atan2(hy - py, hx - px) * 180 / Math.PI;
    const head = [[-10, -34], [50, -36], [104, -20], [132, 0], [104, 20], [50, 36], [-10, 34]];
    let h = P(smooth(head, true), `fill="${F}" stroke="${I}" stroke-width="2"`);
    h += contours(head, 50, 0, 8, .25, `fill="none" stroke="${I}" stroke-width=".6" opacity=".5"`);
    h += P(`M132 0L178 0M178 0L196 -12M178 0L196 12`, `stroke="${pal.red}" stroke-width="2.2" fill="none" stroke-linecap="round"`);
    h += `<g transform="rotate(90 78 -16)">${pupil(78, -16, 2.2, 9, pal)}</g><g transform="rotate(90 78 16)">${pupil(78, 16, 2.2, 9, pal)}</g>`;
    s += `<g transform="translate(${n(hx)} ${n(hy)}) rotate(${n(deg - 6)})">${h}</g>`;
    s += C(cx, cy, 22, `fill="${F}" stroke="${I}" stroke-width="1"`) + C(cx, cy, 4, `fill="${pal.red}"`);
    return s;
  };

  ART.leopard = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += E(400, 470, 380, 440, `fill="url(#${p}spot)"`);
    // whiskers (behind)
    [-1, 1].forEach(sd => { for (let k = 0; k < 8; k++) { const y0 = 600 + k * 6, x0 = 400 + sd * 50; s += P(`M${x0} ${y0}Q${400 + sd * 220} ${y0 - 40 + k * 16} ${400 + sd * 420} ${y0 - 120 + k * 44}`, `fill="none" stroke="${I}" stroke-width=".7" opacity="${n(.35 + r() * .4)}"`); } });
    // ears
    [-1, 1].forEach(sd => {
      const ear = [[520, 252], [548, 160], [606, 132], [640, 196], [610, 288]].map(([x, y]) => [400 + sd * (x - 400), y]);
      s += P(smooth(ear, true), `fill="${F}" stroke="${I}" stroke-width="1.8"`);
      s += P(smooth(scaleAbout(ear, 400 + sd * 182, 215, .58), true), `fill="url(#${p}h1)" stroke="${I}" stroke-width=".8" opacity=".8"`);
    });
    const head = mirror([[400, 214], [484, 220], [562, 258], [616, 338], [634, 440], [616, 542], [562, 632], [490, 696], [400, 724]]);
    const hd = smooth(head, true);
    s += `<clipPath id="${p}hc"><path d="${hd}"/></clipPath>` + P(hd, `fill="${F}" stroke="${I}" stroke-width="2.2"`);
    let inner = '';
    // shadow hatching
    inner += `<rect x="150" y="200" width="200" height="540" fill="url(#${p}h2)" opacity=".28"/>`;
    // fur strokes
    for (let i = 0; i < 360; i++) {
      const a = r() * Math.PI * 2, k = .78 + r() * .24, x = 400 + Math.cos(a) * 230 * k, y = 468 + Math.sin(a) * 256 * k, l = 8 + r() * 12;
      inner += L(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, `stroke="${I}" stroke-width=".6" opacity="${n(.25 + r() * .45)}"`);
    }
    // rosettes
    let placed = 0, tries = 0; const pts = [];
    while (placed < 64 && tries++ < 2000) {
      const x = 180 + r() * 440, y = 230 + r() * 480;
      if (((x - 400) / 225) ** 2 + ((y - 468) / 252) ** 2 > .92) continue;
      if (Math.abs(x - 400) < 92 && y > 380 && y < 680) continue;
      if (Math.abs(x - 400) < 26 && y < 380) continue;
      const rr = 8 + r() * 12;
      if (pts.some(q => Math.hypot(q[0] - x, q[1] - y) < q[2] + rr + 8)) continue;
      pts.push([x, y, rr]); placed++;
      const col = r() < .05 ? pal.red : I;
      for (let j = 0; j < 4; j++) {
        const a1 = j * Math.PI / 2 + r() * .6, a2 = a1 + .85 + r() * .3;
        inner += P(`M${n(x + Math.cos(a1) * rr)} ${n(y + Math.sin(a1) * rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + Math.cos(a2) * rr)} ${n(y + Math.sin(a2) * rr)}`, `fill="none" stroke="${col}" stroke-width="${n(2.4 + r() * 1.6)}" stroke-linecap="round"`);
      }
      inner += C(x, y, rr * .35, `fill="${I}" opacity=".18"`);
    }
    s += `<g clip-path="url(#${p}hc)">${inner}</g>`;
    // tear lines
    [-1, 1].forEach(sd => s += P(`M${400 + sd * 50} 430Q${400 + sd * 56} 520 ${400 + sd * 40} 610`, `fill="none" stroke="${I}" stroke-width="2"`));
    // eyes
    [-1, 1].forEach(sd => {
      const x = 400 + sd * 78;
      s += P(`M${x - 42 * sd} 430Q${x} 394 ${x + 40 * sd} 416Q${x} 446 ${x - 42 * sd} 430Z`, `fill="${pal.green}" opacity="${pal.glow ? .85 : .5}" stroke="${I}" stroke-width="1.6"`);
      s += E(x, 422, 3.4, 14, `fill="${BLACK}"`);
    });
    // sewn third eye
    s += P(`M400 288Q416 322 400 356Q384 322 400 288Z`, `fill="${F}" stroke="${I}" stroke-width="1.3"`) + L(400, 292, 400, 352, `stroke="${pal.red}" stroke-width="1.8"`);
    for (let k = 0; k < 6; k++) s += L(392, 298 + k * 10, 408, 302 + k * 10, `stroke="${I}" stroke-width="1.2"`);
    // muzzle
    s += P(`M366 540L434 540L400 578Z`, `fill="${I}" opacity=".85"`) + L(400, 578, 400, 610, `stroke="${I}" stroke-width="1.6"`);
    s += P(`M338 622Q370 646 400 610Q430 646 462 622`, `fill="none" stroke="${I}" stroke-width="1.6"`);
    [-1, 1].forEach(sd => { for (let a = 0; a < 3; a++) for (let b = 0; b < 4; b++) s += C(400 + sd * (36 + b * 11), 586 + a * 10 + b * 2, 1.5, `fill="${I}" opacity=".8"`); });
    return s;
  };

  ART.lagoon = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill, H = 560; let s = '';
    for (let i = 0; i < 46; i++) { const y = r() * H; s += L(0, y, 800, y, `stroke="${I}" stroke-width="${n(.3 + r() * .6)}" opacity="${n(.03 + r() * .1)}"`); }
    s += C(612, 170, 66, `fill="${I}" opacity=".12"`) + C(612, 170, 66, `fill="url(#${p}dot)" opacity=".55"`) + C(612, 170, 66, `fill="none" stroke="${I}" stroke-width=".8" opacity=".6"`);
    // distant humps
    [[80, 26], [128, 18], [166, 12], [196, 8]].forEach(([x, rr]) => s += P(`M${x - rr} ${H}A${rr} ${rr * .9} 0 0 1 ${x + rr} ${H}`, `fill="${F}" stroke="${I}" stroke-width="1"`));
    // mangrove roots
    for (let i = 0; i < 9; i++) { const y0 = 250 + i * 26 + r() * 10, x1 = 20 + r() * 120; s += P(`M-10 ${n(y0)}C${n(40 + r() * 40)} ${n(y0 + 20)} ${n(x1 + 20)} ${n(H - 120)} ${n(x1)} ${H}`, `fill="none" stroke="${I}" stroke-width="${n(.8 + r() * 1.4)}" opacity="${n(.35 + r() * .4)}"`); }
    // skull
    const upper = [[140, 476], [232, 444], [332, 414], [432, 382], [502, 350], [566, 342], [618, 368], [648, 420], [658, 476], [652, H]];
    const jaw = [[652, H], [600, 520], [520, 478], [400, 482], [280, 480], [170, 488]];
    const shape = upper.concat(jaw.slice(1));
    const sd = smooth(shape, true);
    s += `<clipPath id="${p}lc"><path d="${sd}"/></clipPath>` + P(sd, `fill="${F}" stroke="${I}" stroke-width="2"`);
    s += `<g clip-path="url(#${p}lc)">` + contours(shape, 540, 430, 11, .15, `fill="none" stroke="${I}" stroke-width=".6" opacity=".45"`) + `<rect x="420" y="330" width="260" height="240" fill="url(#${p}h1)" opacity=".3"/></g>`;
    for (let x = 176; x < 520; x += 12 + r() * 6) { const y = 484 - (x - 170) * .004; s += P(`M${n(x)} ${n(y)}L${n(x + 3)} ${n(y + 18 + r() * 14)}L${n(x + 6)} ${n(y)}`, `fill="${I}" opacity=".9"`); }
    const low = [[168, 506], [300, 514], [430, 528], [560, 556], [580, H]];
    s += P(smooth(low, false) + `L168 ${H}Z`, `fill="${F}" stroke="${I}" stroke-width="1.6"`);
    for (let x = 186; x < 540; x += 13 + r() * 6) { const y = 508 + (x - 168) * .1; s += P(`M${n(x)} ${n(y)}L${n(x + 3)} ${n(y - 14 - r() * 10)}L${n(x + 6)} ${n(y)}`, `fill="${I}" opacity=".85"`); }
    // ridge plates
    for (let k = 0; k < 9; k++) { const x = 380 + k * 30, y = 395 - k * 6 + (k > 5 ? (k - 5) * 14 : 0); s += P(`M${x} ${y}l10 -20l10 20`, `fill="${F}" stroke="${I}" stroke-width="1.1"`); }
    s += C(552, 404, 24, `fill="${BLACK}" stroke="${I}" stroke-width="1.6"`) + C(552, 404, 30, `fill="none" stroke="${I}" stroke-width=".7" opacity=".6"`);
    s += pupil(552, 404, 2.6, 11, pal);
    // waterline
    s += L(0, H, 800, H, `stroke="${I}" stroke-width="1.2" opacity=".8"`);
    // reflection + water
    for (let y = H + 6; y < 1000; y += 5 + (y - H) * .012) {
      const k = (y - H) / 440, ym = H - (y - H) * 1.05;
      let x = -20 - r() * 40;
      while (x < 820) {
        const len = 6 + r() * 40 * (1 + k);
        const inSkull = ym > 340 && x > 150 + (H - ym) * .2 && x < 655;
        const op = inSkull ? .55 - k * .35 : .05 + r() * .12 * (1 - k);
        if (r() < (inSkull ? .85 : .5)) s += L(x, y, x + len, y, `stroke="${I}" stroke-width="${n(.6 + r() * .8)}" opacity="${n(Math.max(.03, op))}"`);
        x += len + 4 + r() * 18 * (1 + k);
      }
      if (Math.abs(ym - 404) < 6) s += L(540 + (r() - .5) * 10, y, 566, y, `stroke="${pal.green}" stroke-width="2" opacity=".8"`);
    }
    s += `<rect x="0" y="${H - 30}" width="800" height="60" fill="${pal.bg || F}" opacity=".18"/>`;
    return s;
  };

  ART.zuma = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    for (let i = 0; i < 90; i++) s += C(r() * 800, r() * 420, r() * 1.1 + .2, `fill="${I}" opacity="${n(r() * .7)}"`);
    const yTop = x => 1000 - 830 * Math.sqrt(Math.max(0, 1 - ((x - 400) / 360) ** 2));
    const dome = `M40 1000A360 830 0 0 1 760 1000Z`;
    s += `<clipPath id="${p}zc"><path d="${dome}"/></clipPath>` + P(dome, `fill="${pal.bg ? WASH : F}" stroke="${I}" stroke-width="1.6"`);
    let g = '';
    for (let i = 0; i < 110; i++) {
      const x0 = 44 + i * 6.5 + (r() - .5) * 4, y0 = yTop(x0) + 4 + r() * 40, x1 = x0 + (x0 - 400) * .12;
      g += P(`M${n(x0)} ${n(y0)}Q${n(x0 + (r() - .5) * 18)} ${n((y0 + 1000) / 2)} ${n(x1)} 1000`, `fill="none" stroke="${I}" stroke-width="${n(.4 + r() * .9)}" opacity="${n(.12 + r() * .45)}" stroke-dasharray="${n(20 + r() * 120)} ${n(4 + r() * 30)}"`);
    }
    for (let i = 0; i < 14; i++) { const x0 = 100 + r() * 600, y0 = yTop(x0) + 20 + r() * 80; g += P(`M${n(x0)} ${n(y0)}Q${n(x0 + (r() - .5) * 20)} ${n(y0 + 200)} ${n(x0 + (x0 - 400) * .1)} ${n(y0 + 300 + r() * 300)}`, `fill="none" stroke="${BLACK}" stroke-width="${n(5 + r() * 12)}" opacity=".45" stroke-linecap="round"`); }
    g += `<rect x="40" y="170" width="360" height="830" fill="url(#${p}h2)" opacity=".18"/>`;
    // face
    g += P(`M290 470Q330 440 380 462M420 462Q470 440 510 470`, `fill="none" stroke="${I}" stroke-width="2.4"`);
    [330, 470].forEach(x => { g += E(x, 506, 56, 30, `fill="${BLACK}" opacity=".8"`) + E(x, 506, 56, 30, `fill="url(#${p}h1)" opacity=".5"`) + E(x, 506, 56, 30, `fill="none" stroke="${I}" stroke-width=".8" opacity=".6"`); });
    g += P(`M400 470L396 600Q384 640 372 646M400 600Q412 640 428 646`, `fill="none" stroke="${I}" stroke-width="1.8"`);
    const crack = [[318, 712]]; for (let x = 330; x <= 482; x += 12) crack.push([x, 712 + (r() - .5) * 12]);
    g += P(poly(crack, false), `fill="none" stroke="${I}" stroke-width="2"`) + P(poly(crack.map(([x, y]) => [x, y + 5]), false), `fill="none" stroke="${pal.red}" stroke-width="1.2" opacity=".9"`);
    s += `<g clip-path="url(#${p}zc)">${g}</g>`;
    s += pupil(330, 508, 2.2, 3.2, pal) + pupil(470, 508, 2.2, 3.2, pal);
    s += L(0, 952, 800, 952, `stroke="${pal.red}" stroke-width="1.4"`);
    // figure for scale
    s += `<g transform="translate(600 925)" fill="${I}">${C(0, 0, 3.4)}<path d="M-3 5L3 5L4 22L1.5 22L0 34L-1.5 22L-4 22Z"/></g>`;
    s += T(612, 912, '1.7 M', `${MONO} font-size="9" fill="${I}" opacity=".7"`) + L(606, 925, 606, 959, `stroke="${I}" stroke-width=".5" opacity=".6"`);
    return s;
  };

  ART.rider = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    s += `<clipPath id="${p}mc">${C(420, 420, 300)}</clipPath>`;
    s += C(420, 420, 300, `fill="${I}" opacity="${pal.bg ? .92 : .2}"`);
    s += `<g clip-path="url(#${p}mc)">${C(470, 380, 300, `fill="url(#${p}hb)" opacity=".7"`)}${C(520, 350, 300, `fill="url(#${p}hb)" opacity=".8"`)}</g>`;
    for (let i = 0; i < 40; i++) s += C(r() * 800, r() * 1000, r() * 1 + .3, `fill="${I}" opacity="${n(r() * .5)}"`);
    const S = `fill="${F}" stroke="${I}" stroke-width="1.3"`;
    const leg = (pts) => P(poly(pts, false), `fill="none" stroke="${I}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`) + P(poly(pts, false), `fill="none" stroke="${F}" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"`);
    s += leg([[300, 640], [282, 760], [300, 900], [286, 912]]) + leg([[345, 650], [350, 770], [338, 905], [326, 914]]);
    s += leg([[540, 640], [574, 750], [548, 900], [536, 912]]) + leg([[505, 650], [520, 770], [502, 905], [490, 914]]);
    // tail
    for (let i = 0; i < 26; i++) s += P(`M590 585Q${n(640 + r() * 30)} ${n(660 + r() * 40)} ${n(612 + r() * 60)} ${n(770 + r() * 70)}`, `fill="none" stroke="${I}" stroke-width=".7" opacity="${n(.4 + r() * .5)}"`);
    const body = [[262, 560], [330, 528], [470, 522], [560, 540], [604, 596], [584, 652], [470, 672], [330, 664], [262, 640], [244, 600]];
    const bd = smooth(body, true);
    s += `<clipPath id="${p}bc"><path d="${bd}"/></clipPath>` + P(bd, S);
    let q = ''; for (let k = -10; k < 30; k++) { q += L(200 + k * 22, 500, 380 + k * 22, 700, `stroke="${I}" stroke-width=".7" opacity=".55"`) + L(380 + k * 22, 500, 200 + k * 22, 700, `stroke="${I}" stroke-width=".7" opacity=".55"`); }
    s += `<g clip-path="url(#${p}bc)">${q}</g>`;
    for (let x = 270; x < 590; x += 7) { const y = 652 + Math.sin((x - 270) / 320 * Math.PI) * 18; s += L(x, y, x + (r() - .5) * 3, y + 22 + r() * 8, `stroke="${I}" stroke-width=".8" opacity=".8"`); if (x % 49 < 7) s += C(x, y + 34, 3, `fill="${pal.red}"`); }
    // neck & head
    const neck = [[250, 604], [236, 520], [214, 440], [186, 380], [160, 356], [128, 392], [92, 440], [86, 462], [104, 470], [150, 458], [180, 470], [212, 540], [292, 566]];
    s += P(smooth(neck, true), S);
    s += P(smooth([[150, 362], [132, 330], [146, 300], [164, 346]], true), S);
    s += P(`M140 388Q130 420 98 452`, `fill="none" stroke="${I}" stroke-width=".8" opacity=".7"`);
    s += pupil(138, 398, 2, 6, pal, 'transform="rotate(30 138 398)"');
    for (let i = 0; i < 18; i++) s += P(`M${n(196 + i * 3)} ${n(380 + i * 9)}q${n(16 + r() * 10)} 4 ${n(22 + r() * 16)} 16`, `fill="none" stroke="${I}" stroke-width=".8" opacity=".7"`);
    // rider
    s += P(smooth([[402, 382], [470, 380], [500, 470], [528, 610], [440, 622], [356, 604], [380, 470]], true), S);
    for (let k = 0; k < 7; k++) s += P(`M${410 + k * 12} 400Q${400 + k * 16} 500 ${380 + k * 22} 612`, `fill="none" stroke="${I}" stroke-width=".7" opacity=".6"`);
    s += E(436, 352, 20, 24, S);
    for (let k = 0; k < 9; k++) s += E(436 + k * 1.4, 330 - k * 15, 26 - k * 1.8, 10, S);
    for (let i = 0; i < 14; i++) s += P(`M${448} ${200}Q${n(500 + i * 6)} ${n(170 + i * 4)} ${n(540 + i * 9)} ${n(220 + i * 8 + r() * 20)}`, `fill="none" stroke="${pal.red}" stroke-width="1" opacity="${n(.5 + r() * .5)}"`);
    s += pupil(428, 352, 6, 1.6, pal);
    s += L(330, 180, 382, 880, `stroke="${I}" stroke-width="2.2"`) + P(`M331 192L392 214L333 236Z`, `fill="${pal.red}"`) + P(`M326 170L330 150L336 170Z`, `fill="${I}"`);
    s += L(0, 912, 800, 912, `stroke="${I}" stroke-width="1" opacity=".7"`);
    for (let i = 0; i < 40; i++) { const y = 915 + r() * 85; s += L(r() * 800, y, r() * 800, y, `stroke="${I}" stroke-width=".5" opacity="${n(r() * .25)}"`); }
    return s;
  };

  /* =======================================================================
     CHAPTER II — FORBIDDEN SCIENCE
     ======================================================================= */
  function tentacle(r, x, y, ang, len, w, I, F, seg = 26) {
    const pts = []; let a = ang, cx = x, cy = y; const ph = r() * 6, amp = .08 + r() * .1;
    for (let i = 0; i <= seg; i++) { pts.push([cx, cy]); a += Math.sin(i * .5 + ph) * amp; cx += Math.cos(a) * len / seg; cy += Math.sin(a) * len / seg; }
    let s = '';
    for (let k = 0; k < 4; k++) { const part = pts.slice(0, Math.round(pts.length * (1 - k * .22))); s += P(smooth(part), `fill="none" stroke="${I}" stroke-width="${n(w * (1 - k * .24) + 1.2)}" stroke-linecap="round"`) + P(smooth(part), `fill="none" stroke="${F}" stroke-width="${n(w * (1 - k * .24))}" stroke-linecap="round"`); }
    pts.forEach((q, i) => { if (i % 3 === 1 && i < seg - 2) s += C(q[0], q[1], Math.max(.8, w * .22 * (1 - i / seg)), `fill="none" stroke="${I}" stroke-width=".6"`); });
    return s;
  }

  ART.specimen = ({ p, pal, r, o }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += `<rect width="800" height="1000" fill="url(#${p}spot)"/>`;
    s += `<rect x="230" y="200" width="340" height="690" rx="34" fill="${pal.green}" opacity=".05"/>`;
    s += `<rect x="236" y="262" width="328" height="622" rx="30" fill="${pal.green}" opacity="${pal.glow ? .06 : .08}"/>`;
    s += P(`M240 262Q400 274 560 262`, `fill="none" stroke="${I}" stroke-width=".8" opacity=".6"`);
    for (let i = 0; i < 26; i++) s += C(250 + r() * 300, 280 + r() * 590, r() * 2.4 + .4, `fill="none" stroke="${I}" stroke-width=".5" opacity="${n(.2 + r() * .4)}"`);
    s += L(400, 205, 400, 470, `stroke="${I}" stroke-width=".8"`);
    const cx = 400, cy = 520 + (o.variant || 0) * 10;
    const tn = 8 + Math.floor(r() * 3);
    for (let i = 0; i < tn; i++) { const a = Math.PI * .1 + (i / (tn - 1)) * Math.PI * .8 + (r() - .5) * .2; s += tentacle(r, cx + Math.cos(a) * 50, cy + Math.sin(a) * 50, a, 160 + r() * 140, 9 + r() * 5, I, F); }
    const b = blob(cx, cy, 74, 22, r);
    s += P(smooth(b, true), `fill="${F}" stroke="${I}" stroke-width="2"`) + contours(b, cx, cy - 10, 8, .3, `fill="none" stroke="${I}" stroke-width=".6" opacity=".5"`);
    [[-28, -24], [0, -38], [28, -26], [-12, -8], [16, -6]].forEach(([dx, dy], k) => { s += C(cx + dx, cy + dy, k === 1 ? 9 : 6, `fill="${BLACK}" stroke="${I}" stroke-width="1"`) + pupil(cx + dx, cy + dy, 1.4, k === 1 ? 5 : 3.4, pal); });
    // jar
    s += `<rect x="230" y="200" width="340" height="690" rx="34" fill="none" stroke="${I}" stroke-width="2"/>`;
    s += L(256, 240, 256, 860, `stroke="${I}" stroke-width="1.2" opacity=".35"`) + L(268, 260, 268, 520, `stroke="${I}" stroke-width=".7" opacity=".3"`) + L(546, 260, 546, 860, `stroke="${I}" stroke-width=".7" opacity=".25"`);
    s += `<rect x="214" y="156" width="372" height="50" rx="4" fill="${F}" stroke="${I}" stroke-width="1.8"/>`;
    for (let x = 222; x < 580; x += 6) s += L(x, 162, x, 200, `stroke="${I}" stroke-width=".6" opacity=".55"`);
    // label
    s += `<rect x="290" y="752" width="220" height="86" fill="${I}" opacity=".94"/>`;
    s += T(400, 778, o.jar || 'SPECIMEN 001', `${MONO} font-size="15" font-weight="600" letter-spacing="2" text-anchor="middle" fill="${F}"`);
    s += L(304, 788, 496, 788, `stroke="${F}" stroke-width=".8"`);
    s += T(400, 808, o.sub || 'ORIGIN UNKNOWN — REC. 1987', `${MONO} font-size="9.5" letter-spacing="1" text-anchor="middle" fill="${F}"`);
    s += T(400, 826, 'DO NOT OPEN', `${MONO} font-size="9.5" letter-spacing="3" text-anchor="middle" fill="${pal.red}"`);
    // ruler
    s += L(630, 200, 630, 890, `stroke="${I}" stroke-width=".8" opacity=".7"`);
    for (let y = 200, k = 0; y <= 890; y += 13.8, k++) s += L(630, y, k % 5 ? 638 : 646, y, `stroke="${I}" stroke-width=".7" opacity=".7"`) + (k % 10 === 0 ? T(652, y + 3, String(k), `${MONO} font-size="9" fill="${I}" opacity=".7"`) : '');
    s += L(140, 640, 300, 640, `stroke="${I}" stroke-width=".6" stroke-dasharray="3 3"`) + C(300, 640, 2.5, `fill="${pal.red}"`) + T(140, 632, 'fig. a — prehensile', `${MONO} font-size="10" fill="${I}" opacity=".8"`);
    return s;
  };

  ART.contact = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    for (let i = 0; i < 13; i++) s += C(400, 515, 40 + i * 30, `fill="none" stroke="${I}" stroke-width=".6" opacity="${n(.42 - i * .028)}" ${i % 3 === 1 ? 'stroke-dasharray="1 6"' : ''}`);
    // alien hand
    s += P(smooth(blob(400, 160, 70, 16, r, .1), true), `fill="${F}" stroke="${I}" stroke-width="1.8"`);
    s += contours(blob(400, 160, 70, 16, rng(9), .1), 400, 160, 6, .3, `fill="none" stroke="${I}" stroke-width=".5" opacity=".5"`);
    for (let f = 0; f < 6; f++) {
      let a = Math.PI / 2 + (f / 5 - .5) * 1.5, x = 400 + Math.cos(a) * 62, y = 160 + Math.sin(a) * 62;
      const pts = [[x, y]];
      for (let j = 0; j < 5; j++) { const target = Math.atan2(492 - y, 400 - x); a += (target - a) * .38; const len = 66 - j * 6; x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); }
      s += P(poly(pts, false), `fill="none" stroke="${I}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"`) + P(poly(pts, false), `fill="none" stroke="${F}" stroke-width="6.4" stroke-linejoin="round" stroke-linecap="round"`);
      pts.slice(1, -1).forEach(q => s += C(q[0], q[1], 5, `fill="${F}" stroke="${I}" stroke-width="1"`));
      const t = pts[pts.length - 1]; s += C(t[0], t[1], 2.4, `fill="${f === 2 ? pal.red : I}"`);
    }
    // human hand
    s += P(`M386 820L386 590Q386 566 400 566Q414 566 414 590L414 740`, `fill="${F}" stroke="${I}" stroke-width="1.8"`);
    s += P(smooth([[386, 700], [340, 700], [318, 740], [320, 800], [340, 860], [380, 900], [440, 900], [470, 860], [472, 790], [460, 730], [414, 724]], false), `fill="${F}" stroke="${I}" stroke-width="1.8"`);
    [[350, 724, 760], [370, 742, 770], [410, 750, 770], [440, 742, 760]].forEach(([x, y1, y2]) => s += P(`M${x} ${y1}Q${x + 22} ${y1 + 8} ${x + 26} ${y2}`, `fill="none" stroke="${I}" stroke-width="1" opacity=".7"`));
    s += P(`M391 586Q400 580 409 586`, `fill="none" stroke="${I}" stroke-width=".8" opacity=".7"`);
    for (let k = 0; k < 20; k++) s += P(`M${300 + k * 9} 980Q${n(330 + k * 6)} 920 ${n(340 + k * 5)} ${n(890 + r() * 10)}`, `fill="none" stroke="${I}" stroke-width=".5" opacity=".35"`);
    // spark
    s += `<g ${pal.glow ? `filter="url(#${p}glow)"` : ''}>${C(400, 528, 5, `fill="${pal.green}"`)}${L(400, 500, 400, 556, `stroke="${pal.green}" stroke-width="1.2"`)}${L(372, 528, 428, 528, `stroke="${pal.green}" stroke-width="1.2"`)}</g>`;
    const tick = (x, y, sx, sy) => P(`M${x} ${y + sy * 24}V${y}H${x + sx * 24}`, `fill="none" stroke="${I}" stroke-width="1.2"`);
    s += tick(40, 40, 1, 1) + tick(760, 40, -1, 1) + tick(40, 960, 1, -1) + tick(760, 960, -1, -1);
    s += T(52, 76, 'SIGNAL 77', `${MONO} font-size="11" letter-spacing="2" fill="${I}"`) + T(52, 92, '03:17:44 — NO ORIGIN', `${MONO} font-size="9" fill="${I}" opacity=".6"`);
    s += T(748, 944, 'CONTACT / 01', `${MONO} font-size="11" letter-spacing="2" text-anchor="end" fill="${pal.red}"`);
    return s;
  };

  ART.organism = ({ p, pal, r, o }) => {
    const I = pal.ink, F = pal.fill, cx = 400, cy = 500; let s = '';
    if (pal.bg) s += C(cx, cy, 420, `fill="url(#${p}spot)"`);
    const sp = 18 + (o.variant || 0) * 2;
    for (let i = 0; i < sp; i++) {
      const a = i / sp * Math.PI * 2 + .1, x1 = cx + Math.cos(a) * 250, y1 = cy + Math.sin(a) * 250, L2 = 360 + (i % 3) * 30 + r() * 30, x2 = cx + Math.cos(a) * L2, y2 = cy + Math.sin(a) * L2;
      s += L(x1, y1, x2, y2, `stroke="${I}" stroke-width="${i % 3 ? 1 : 2}"`);
      for (let k = 1; k < 4; k++) { const rr = 250 + (L2 - 250) * k / 4, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr, w = 8 - k * 1.6; s += L(px - Math.sin(a) * w, py + Math.cos(a) * w, px + Math.sin(a) * w, py - Math.cos(a) * w, `stroke="${I}" stroke-width=".8"`); }
      s += C(x2, y2, i % 3 ? 2.4 : 4, `fill="${i % 6 === 0 ? pal.red : I}"`);
    }
    const sides = 9 + (o.variant || 0) % 4;
    s += P(poly(Array.from({ length: sides }, (_, i) => [cx + Math.cos(i / sides * Math.PI * 2) * 262, cy + Math.sin(i / sides * Math.PI * 2) * 262])), `fill="${F}" stroke="${I}" stroke-width="1.6"`);
    for (let R = 245; R > 60; R -= 23) {
      s += C(cx, cy, R, `fill="none" stroke="${I}" stroke-width=".6" opacity=".55"`);
      const k = Math.floor(2 * Math.PI * R / 19);
      for (let j = 0; j < k; j++) { const a = j / k * Math.PI * 2 + R; const x = cx + Math.cos(a) * (R - 11), y = cy + Math.sin(a) * (R - 11); const red = r() < .025; s += C(x, y, 5.6, `fill="${red ? pal.red : 'none'}" stroke="${I}" stroke-width=".7" opacity="${red ? 1 : .8}"`); }
    }
    s += C(cx, cy, 52, `fill="${F}" stroke="${I}" stroke-width="1.6"`);
    for (let k = 1; k < 5; k++) s += C(cx, cy, 52 - k * 9, `fill="none" stroke="${I}" stroke-width=".6" opacity=".6"`);
    s += E(cx, cy, 16, 26, `fill="${BLACK}" stroke="${I}" stroke-width="1"`) + pupil(cx, cy, 3, 16, pal);
    s += T(400, 960, `ORGANISM ${o.code || 'U-01'} — RADIAL SYMMETRY 1:${sides}`, `${MONO} font-size="11" letter-spacing="2.5" text-anchor="middle" fill="${I}" opacity=".7"`);
    return s;
  };

  ART.anatomy = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    s += `<rect width="800" height="1000" fill="url(#${p}grid)" opacity=".07"/>`;
    const head = mirror([[400, 70], [470, 90], [500, 160], [490, 240], [450, 300], [400, 318]]);
    s += P(smooth(head, true), `fill="${F}" stroke="${I}" stroke-width="1.8"`) + contours(head, 400, 160, 9, .2, `fill="none" stroke="${I}" stroke-width=".5" opacity=".5"`, .1);
    [-1, 1].forEach(sd => s += P(`M${400 + sd * 16} 222Q${400 + sd * 60} 190 ${400 + sd * 76} 230Q${400 + sd * 50} 262 ${400 + sd * 16} 222Z`, `fill="${BLACK}" stroke="${I}" stroke-width="1.2"`) + pupil(400 + sd * 50, 228, 2, 7, pal));
    s += P(`M386 316L380 380M414 316L420 380`, `stroke="${I}" stroke-width="1.4" fill="none"`);
    const torso = mirror([[400, 376], [456, 390], [480, 470], [470, 600], [452, 700], [430, 780], [400, 800]]);
    s += P(smooth(torso, true), `fill="${F}" stroke="${I}" stroke-width="1.8"`);
    for (let i = 0; i < 9; i++) { const y = 414 + i * 20; s += P(`M400 ${y}Q${452 - i} ${y - 6} ${464 - i * 1.5} ${y + 22}M400 ${y}Q${348 + i} ${y - 6} ${336 + i * 1.5} ${y + 22}`, `fill="none" stroke="${I}" stroke-width=".9" opacity=".75"`); }
    for (let y = 390; y < 790; y += 13) s += `<rect x="395" y="${y}" width="10" height="9" rx="2" fill="${F}" stroke="${I}" stroke-width=".7"/>`;
    s += P(smooth(blob(430, 480, 26, 12, r, .3), true), `fill="${pal.red}" opacity=".9"`) + P(smooth(blob(372, 470, 18, 12, r, .3), true), `fill="none" stroke="${pal.red}" stroke-width="1.4"`);
    s += E(370, 600, 26, 40, `fill="${pal.green}" opacity="${pal.glow ? .18 : .2}" stroke="${I}" stroke-width=".8"`);
    let sp = []; for (let t = 0; t < 1; t += .01) { const a = t * Math.PI * 9, rr = 6 + t * 30; sp.push([432 + Math.cos(a) * rr, 650 + Math.sin(a) * rr * .8]); } s += P(poly(sp, false), `fill="none" stroke="${I}" stroke-width=".9"`);
    [-1, 1].forEach(sd => { s += P(`M${400 + sd * 54} 400Q${400 + sd * 120} 520 ${400 + sd * 130} 700Q${400 + sd * 134} 820 ${400 + sd * 150} 930`, `fill="none" stroke="${I}" stroke-width="5"`) + P(`M${400 + sd * 54} 400Q${400 + sd * 120} 520 ${400 + sd * 130} 700Q${400 + sd * 134} 820 ${400 + sd * 150} 930`, `fill="none" stroke="${F}" stroke-width="3"`); for (let k = 0; k < 4; k++) s += L(400 + sd * (150 + k * 4), 930, 400 + sd * (140 + k * 12), 975, `stroke="${I}" stroke-width="1.2"`); });
    [-1, 1].forEach(sd => { s += P(`M${400 + sd * 24} 796L${400 + sd * 40} 980`, `stroke="${I}" stroke-width="5" fill="none"`) + P(`M${400 + sd * 24} 796L${400 + sd * 40} 980`, `stroke="${F}" stroke-width="3" fill="none"`); });
    const labels = [[400, 120, 'L', 'CRANIAL VAULT'], [350, 228, 'L', 'OCULAR SAC'], [440, 430, 'R', 'RESPIRATORY LATTICE'], [430, 480, 'R', 'SECOND HEART'], [372, 470, 'L', 'VESTIGIAL HEART'], [370, 600, 'L', 'UNKNOWN GLAND'], [432, 650, 'R', 'SPIRAL GUT'], [400, 720, 'R', 'SPINAL COLUMN ×31']];
    labels.forEach(([x, y, side, txt], i) => {
      const lx = side === 'L' ? 70 : 730, ly = 100 + i * 105;
      s += P(`M${x} ${y}L${side === 'L' ? lx + 120 : lx - 120} ${ly}H${lx}`, `fill="none" stroke="${I}" stroke-width=".6" opacity=".7"`) + C(x, y, 2.5, `fill="${i === 3 ? pal.red : I}"`);
      s += T(lx, ly - 6, `${String(i + 1).padStart(2, '0')}  ${txt}`, `${MONO} font-size="10" letter-spacing="1.2" fill="${I}" text-anchor="${side === 'L' ? 'start' : 'end'}"`);
    });
    s += T(400, 40, 'FIG. 3 — ANATOMY OF THE UNKNOWN', `${MONO} font-size="11" letter-spacing="3" text-anchor="middle" fill="${pal.red}"`);
    return s;
  };

  ART.classified = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    const paper = pal.bg === BONE ? '#d4c9b5' : BONE, ink = '#17110f';
    s += `<g transform="rotate(5 400 500)"><rect x="190" y="160" width="440" height="620" fill="${paper}" opacity=".35"/></g>`;
    let d = `<rect x="170" y="140" width="460" height="660" fill="${paper}"/>`;
    d += `<rect x="170" y="140" width="460" height="660" fill="url(#${p}h2)" opacity=".06"/>`;
    d += T(200, 186, 'CLASSIFIED BIOLOGY', `${MONO} font-size="17" font-weight="600" letter-spacing="3" fill="${ink}"`) + T(600, 186, 'FILE 7/7', `${MONO} font-size="11" text-anchor="end" fill="${ink}"`);
    d += L(200, 198, 600, 198, `stroke="${ink}" stroke-width="1.2"`);
    d += `<rect x="200" y="220" width="170" height="210" fill="#0b0b0b"/>`;
    const mini = render('organism', { pal: 'dark', mis: false, vig: false, code: 'X-7', variant: 3, inner: true });
    d += `<svg x="200" y="220" width="170" height="210" viewBox="100 200 600 600" preserveAspectRatio="xMidYMid slice">${mini}</svg>`;
    d += T(200, 448, 'PLATE 7 — RECOVERED TISSUE', `${MONO} font-size="8.5" fill="${ink}"`);
    for (let y = 228; y < 430; y += 13) { const w = 160 + r() * 60; d += `<rect x="392" y="${y}" width="${n(Math.min(w, 208))}" height="${r() < .22 ? 10 : 4}" fill="${ink}" opacity="${r() < .22 ? .95 : .55}"/>`; }
    for (let y = 474; y < 770; y += 14) { const red = r() < .2; d += `<rect x="200" y="${y}" width="${n(240 + r() * 160)}" height="${red ? 11 : 4}" fill="${ink}" opacity="${red ? .95 : .5}"/>`; }
    d += `<g transform="rotate(-14 470 620)" ${pal.glow ? `filter="url(#${p}rough)"` : ''}><rect x="340" y="588" width="260" height="64" fill="none" stroke="${RED}" stroke-width="4"/><text x="470" y="634" ${GROT} font-weight="900" font-size="38" letter-spacing="6" text-anchor="middle" fill="${RED}" textLength="230" lengthAdjust="spacingAndGlyphs">RESTRICTED</text></g>`;
    s += `<g transform="rotate(-3 400 470)">${d}</g>`;
    s += P(`M548 110L548 190Q548 206 532 206Q516 206 516 190L516 128Q516 118 526 118Q536 118 536 128L536 186`, `fill="none" stroke="${I}" stroke-width="2.2" opacity=".9"`);
    s += T(400, 900, 'DECLASSIFICATION DATE: NEVER', `${MONO} font-size="11" letter-spacing="3" text-anchor="middle" fill="${I}" opacity=".7"`);
    return s;
  };

  /* =======================================================================
     CHAPTER III — BODY OF HORROR
     ======================================================================= */
  const boneLine = (pts, w, I, F) => P(poly(pts, false), `fill="none" stroke="${I}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"`) + P(poly(pts, false), `fill="none" stroke="${F}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`);

  ART.ribcage = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += E(400, 440, 360, 440, `fill="url(#${p}spot)"`);
    s += P(smooth(blob(432, 392, 52, 14, r, .2), true), `fill="${pal.red}" opacity=".75"`);
    const hv = []; branch(r, 432, 350, -Math.PI / 2, 40, 6, 2.5, `stroke="${pal.red}" fill="none" opacity=".8"`, hv); s += hv.join('');
    for (let y = 150; y < 900; y += y < 520 ? 22 : 30) { const w = y < 520 ? 22 : 34, h = y < 520 ? 16 : 24; s += `<rect x="${400 - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" fill="${F}" stroke="${I}" stroke-width="1.1"/>` + L(400 - w / 2 - 10, y + h / 2, 400 + w / 2 + 10, y + h / 2, `stroke="${I}" stroke-width="1"`); }
    s += `<rect x="388" y="226" width="24" height="250" rx="10" fill="${F}" stroke="${I}" stroke-width="1.4"/>`;
    for (let k = 0; k < 6; k++) s += L(390, 262 + k * 36, 410, 262 + k * 36, `stroke="${I}" stroke-width=".8"`);
    [-1, 1].forEach(sd => {
      s += boneLine([[400 + sd * 10, 216], [400 + sd * 110, 196], [400 + sd * 200, 182]], 9, I, F);
      for (let i = 0; i < 12; i++) {
        const W = 110 + Math.sin((i + 2) / 14 * Math.PI) * 120, y0 = 244 + i * 20, y1 = 290 + i * 38;
        const free = i > 9;
        const pts = [[400 + sd * (free ? 22 : 12), y0 + (free ? 160 : 0)], [400 + sd * W * .7, y0 - 10 + (free ? 150 : 0)], [400 + sd * W, y1], [400 + sd * W * .86, y1 + 60 + i * 2]];
        const d = smooth(pts);
        s += P(d, `fill="none" stroke="${I}" stroke-width="10.5" stroke-linecap="round"`) + P(d, `fill="none" stroke="${F}" stroke-width="7.5" stroke-linecap="round"`) + P(d, `fill="none" stroke="${I}" stroke-width=".5" opacity=".5"`);
      }
    });
    [-1, 1].forEach(sd => s += P(`M400 880Q${400 + sd * 120} 820 ${400 + sd * 220} 860Q${400 + sd * 240} 940 ${400 + sd * 160} 990`, `fill="none" stroke="${I}" stroke-width="1.6"`));
    [[612, 300, '01 — COSTA VERA'], [640, 520, '02 — COSTA FLUCTUANS'], [160, 400, '03 — STERNUM']].forEach(([x, y, t], i) => { const tx = i < 2 ? 730 : 70; s += L(x, y, tx, y - 40, `stroke="${I}" stroke-width=".6"`) + T(tx, y - 48, t, `${MONO} font-size="10" letter-spacing="1" fill="${I}" text-anchor="${i < 2 ? 'end' : 'start'}"`); });
    if (pal.bg) s += `<rect y="640" width="800" height="360" fill="url(#${p}fade)"/>`;
    return s;
  };

  ART.heart = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill, R = pal.red; let s = '';
    if (pal.bg) s += E(400, 460, 360, 460, `fill="url(#${p}spot)"`);
    const roots = []; for (let k = 0; k < 7; k++) branch(r, 410 + (k - 3) * 6, 690, Math.PI / 2 + (k - 3) * .22, 70 + r() * 30, 6, 2.2, `stroke="${R}" fill="none" opacity=".85"`, roots); s += roots.join('');
    const up = []; for (let k = 0; k < 3; k++) branch(r, 420 + k * 50, 200 - k * 10, -Math.PI / 2 + (k - 1) * .3, 60, 5, 2, `stroke="${I}" fill="none" opacity=".55"`, up); s += up.join('');
    const tube = (d, w) => P(d, `fill="none" stroke="${I}" stroke-width="${w + 3}" stroke-linecap="round"`) + P(d, `fill="none" stroke="${F}" stroke-width="${w}" stroke-linecap="round"`) + P(d, `fill="none" stroke="${I}" stroke-width=".5" opacity=".6" stroke-dasharray="2 4"`);
    s += tube(`M420 340Q412 230 470 200Q540 176 562 230Q576 270 568 320`, 34);
    s += tube(`M420 210L420 120M470 196L478 104M524 190L548 110`, 14);
    s += tube(`M368 350Q330 280 260 270Q220 266 196 300`, 28);
    s += tube(`M520 330Q560 300 610 310`, 20);
    const h = [[400, 330], [462, 298], [524, 326], [550, 402], [536, 502], [494, 584], [444, 652], [410, 694], [382, 640], [326, 580], [286, 498], [282, 416], [312, 348]];
    const hd = smooth(h, true);
    s += `<clipPath id="${p}hc"><path d="${hd}"/></clipPath>` + P(hd, `fill="${F}" stroke="${I}" stroke-width="2"`);
    let g = contours(h, 420, 470, 12, .1, `fill="none" stroke="${R}" stroke-width=".9" opacity=".7"`);
    g += `<rect x="280" y="290" width="120" height="420" fill="url(#${p}h1)" opacity=".35"/>`;
    const cor = []; branch(r, 430, 350, Math.PI / 2 - .2, 70, 6, 2.6, `stroke="${R}" fill="none"`, cor); branch(r, 470, 340, Math.PI / 2 + .5, 60, 5, 2.2, `stroke="${R}" fill="none"`, cor); g += cor.join('');
    s += `<g clip-path="url(#${p}hc)">${g}</g>`;
    s += P(`M410 340Q440 500 412 690`, `fill="none" stroke="${I}" stroke-width="1.2" opacity=".7"`);
    s += T(70, 930, 'COR — FIG. 11', `${MONO} font-size="11" letter-spacing="3" fill="${I}"`) + T(730, 930, '72 / MIN', `${MONO} font-size="11" letter-spacing="3" text-anchor="end" fill="${R}"`);
    return s;
  };

  ART.spine = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += `<rect width="800" height="1000" fill="url(#${p}spot)"/>`;
    const xs = t => 400 + 70 * Math.sin(t * Math.PI * 1.6 + .4);
    const nerves = [];
    for (let i = 0; i < 26; i++) { const t = i / 25, y = 90 + t * 820, x = xs(t); [-1, 1].forEach(sd => branch(r, x + sd * (30 + t * 30), y + 10, (sd < 0 ? Math.PI : 0) + (r() - .5) * .5 + .2 * sd, 50 + r() * 50, 4, 1.2, `stroke="${r() < .12 ? pal.red : I}" fill="none" opacity=".45"`, nerves)); }
    s += nerves.join('');
    for (let i = 0; i < 26; i++) {
      const t = i / 25, y = 90 + t * 820, x = xs(t), x2 = xs(t + .01), ang = Math.atan2(30 * 1, (x2 - x) * 100) * 0 + (x2 - x) * 14, w = 44 + t * 56, h = 22 + t * 8;
      let g = `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2.6)}" fill="${F}" stroke="${I}" stroke-width="1.3"/>`;
      g += E(0, 0, w * .3, h * .22, `fill="none" stroke="${I}" stroke-width=".6" opacity=".6"`);
      g += P(`M${n(-w / 2)} 0L${n(-w / 2 - 22 - t * 14)} ${n(-4)}L${n(-w / 2 - 22 - t * 14)} 4ZM${n(w / 2)} 0L${n(w / 2 + 22 + t * 14)} -4L${n(w / 2 + 22 + t * 14)} 4Z`, `fill="${F}" stroke="${I}" stroke-width="1"`);
      if (i === 13) g += E(0, 0, w * .3, h * .22, `fill="${pal.red}"`);
      s += `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(ang)})">${g}</g>`;
    }
    s += T(400, 970, 'COLUMNA VERTEBRALIS — 26 SEGMENTS, 1 MISSING', `${MONO} font-size="10" letter-spacing="2" text-anchor="middle" fill="${I}" opacity=".75"`);
    return s;
  };

  ART.hand = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += E(400, 540, 360, 460, `fill="url(#${p}spot)"`);
    const bone = (a, b, w) => boneLine([a, b], w, I, F) + C(a[0], a[1], w * .62, `fill="${F}" stroke="${I}" stroke-width="1.1"`) + C(b[0], b[1], w * .62, `fill="${F}" stroke="${I}" stroke-width="1.1"`);
    s += boneLine([[360, 1000], [372, 880]], 26, I, F) + boneLine([[440, 1000], [430, 880]], 22, I, F);
    const carp = [[352, 840], [384, 832], [416, 830], [448, 838], [346, 806], [376, 800], [408, 798], [440, 804]];
    carp.forEach(([x, y]) => s += P(smooth(blob(x, y, 14, 9, r, .25), true), `fill="${F}" stroke="${I}" stroke-width="1.2"`));
    const fingers = [[[330, 790], [268, 690], .82, 3], [[356, 780], [326, 560], .9, 4], [[392, 776], [394, 530], .92, 4], [[424, 778], [460, 548], .9, 4], [[452, 790], [518, 590], .85, 4], [[470, 800], [580, 680], .8, 4]];
    fingers.forEach(([a, b, k, segs], f) => {
      s += bone(a, b, 13);
      let dx = (b[0] - a[0]), dy = (b[1] - a[1]), len = Math.hypot(dx, dy) * .55, ang = Math.atan2(dy, dx), cur = b;
      for (let j = 0; j < segs - 1; j++) { ang += (f === 0 ? .12 : -.02 * (f - 2.5)); const nx = cur[0] + Math.cos(ang) * len, ny = cur[1] + Math.sin(ang) * len; s += bone(cur, [nx, ny], 11 - j * 2); cur = [nx, ny]; len *= k; }
      if (f === 5) s += C(cur[0], cur[1], 22, `fill="none" stroke="${pal.red}" stroke-width="1.2" stroke-dasharray="3 4"`) + T(cur[0] + 30, cur[1] - 10, 'DIGITUS VI', `${MONO} font-size="10" letter-spacing="1.5" fill="${pal.red}"`);
    });
    s += T(70, 80, 'MANUS — PLATE 6', `${MONO} font-size="11" letter-spacing="3" fill="${I}"`) + T(70, 98, '27 + 4 BONES', `${MONO} font-size="9" fill="${I}" opacity=".6"`);
    return s;
  };

  ART.eye = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill, cx = 420, cy = 480; let s = '';
    if (pal.bg) s += C(cx, cy, 420, `fill="url(#${p}spot)"`);
    s += P(`M640 450Q720 452 820 420M640 510Q720 512 820 560`, `fill="none" stroke="${I}" stroke-width="1.6"`);
    for (let k = 0; k < 12; k++) s += P(`M640 ${458 + k * 4.5}Q720 ${460 + k * 5} 820 ${426 + k * 11.5}`, `fill="none" stroke="${k % 4 ? I : pal.red}" stroke-width=".6" opacity=".6"`);
    s += C(cx, cy, 250, `fill="${F}" stroke="${I}" stroke-width="2"`) + C(cx, cy, 238, `fill="none" stroke="${I}" stroke-width="1"`) + C(cx, cy, 226, `fill="none" stroke="${pal.red}" stroke-width="1.2" opacity=".85"`);
    s += P(`M${cx - 238} ${cy - 120}Q${cx - 330} ${cy} ${cx - 238} ${cy + 120}`, `fill="${F}" stroke="${I}" stroke-width="1.6"`);
    s += E(cx - 190, cy, 34, 88, `fill="${F}" stroke="${I}" stroke-width="1.6"`) + contours([[cx - 190, cy - 88], [cx - 156, cy], [cx - 190, cy + 88], [cx - 224, cy]], cx - 190, cy, 6, .2, `fill="none" stroke="${I}" stroke-width=".5" opacity=".6"`);
    s += P(`M${cx - 222} ${cy - 120}L${cx - 200} ${cy - 86}M${cx - 222} ${cy + 120}L${cx - 200} ${cy + 86}`, `stroke="${I}" stroke-width="3"`);
    const v = []; for (let k = 0; k < 9; k++) { const a = -.9 + k * .22; branch(r, cx + Math.cos(a) * 222, cy + Math.sin(a) * 222, a + Math.PI + (r() - .5) * .3, 34, 5, 1.6, `stroke="${pal.red}" fill="none" opacity=".75"`, v); } s += v.join('');
    for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 180; s += C(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, .8, `fill="${I}" opacity=".28"`); }
    // inset: the brand iris
    s += C(140, 830, 92, `fill="${F}" stroke="${I}" stroke-width="1.4"`);
    for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2; s += L(140 + Math.cos(a) * 26, 830 + Math.sin(a) * 26, 140 + Math.cos(a) * (66 + (k % 3) * 6), 830 + Math.sin(a) * (66 + (k % 3) * 6), `stroke="${I}" stroke-width=".6" opacity=".65"`); }
    s += C(140, 830, 74, `fill="none" stroke="${I}" stroke-width="1"`) + E(140, 830, 7, 30, `fill="${BLACK}"`) + pupil(140, 830, 2.4, 22, pal);
    s += L(232, 830, 300, 760, `stroke="${I}" stroke-width=".6" opacity=".6"`) + T(306, 756, 'IRIS / FRONTAL', `${MONO} font-size="10" letter-spacing="2" fill="${I}"`);
    [[cx - 190, cy - 88, 'LENS', 100, 160], [cx + 200, cy - 140, 'RETINA', 640, 160], [700, 500, 'N. OPTICUS', 700, 620]].forEach(([x, y, t, tx, ty]) => s += L(x, y, tx, ty + 6, `stroke="${I}" stroke-width=".6"`) + C(x, y, 2.4, `fill="${pal.red}"`) + T(tx, ty, t, `${MONO} font-size="10" letter-spacing="2" fill="${I}" text-anchor="middle"`));
    return s;
  };

  ART.skull = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill; let s = '';
    if (pal.bg) s += E(400, 440, 360, 440, `fill="url(#${p}spot)"`);
    const cr = mirror([[400, 130], [500, 150], [578, 222], [604, 324], [594, 420], [566, 476], [552, 556], [520, 604], [468, 632], [400, 640]]);
    const cd = smooth(cr, true);
    s += `<clipPath id="${p}sc"><path d="${cd}"/></clipPath>` + P(cd, `fill="${F}" stroke="${I}" stroke-width="2"`);
    s += `<g clip-path="url(#${p}sc)">${contours(cr, 400, 330, 12, .3, `fill="none" stroke="${I}" stroke-width=".55" opacity=".45"`, .2)}<rect x="196" y="120" width="90" height="540" fill="url(#${p}h2)" opacity=".5"/><rect x="514" y="120" width="90" height="540" fill="url(#${p}h2)" opacity=".5"/></g>`;
    const sut = [[300, 190]]; for (let x = 312; x <= 500; x += 12) sut.push([x, 172 + (x % 24 ? 8 : -6) + Math.abs(x - 400) * .12]); s += P(poly(sut, false), `fill="none" stroke="${I}" stroke-width="1"`);
    [-1, 1].forEach(sd => { const so = [[400 + sd * 22, 392], [400 + sd * 40, 360], [400 + sd * 100, 360], [400 + sd * 134, 400], [400 + sd * 122, 462], [400 + sd * 64, 478], [400 + sd * 28, 450]]; s += P(smooth(so, true), `fill="${BLACK}" stroke="${I}" stroke-width="1.6"`) + P(smooth(scaleAbout(so, 400 + sd * 78, 420, .7), true), `fill="none" stroke="${I}" stroke-width=".5" opacity=".4"`) + pupil(400 + sd * 78, 424, 1.6, 2.6, pal); });
    s += P(`M400 486Q384 520 380 548Q392 560 400 552Q408 560 420 548Q416 520 400 486Z`, `fill="${BLACK}" stroke="${I}" stroke-width="1.4"`);
    s += P(`M290 470Q320 520 360 530M510 470Q480 520 440 530`, `fill="none" stroke="${I}" stroke-width="1"`);
    for (let k = -5; k < 5; k++) s += `<rect x="${400 + k * 11}" y="586" width="10" height="${30 - Math.abs(k + .5) * 1.4}" rx="2" fill="${F}" stroke="${I}" stroke-width="1"/>`;
    const jaw = [[316, 576], [322, 652], [352, 712], [400, 728], [448, 712], [478, 652], [484, 576]];
    s += P(smooth(jaw), `fill="none" stroke="${I}" stroke-width="2"`) + P(smooth(scaleAbout(jaw, 400, 640, .9)), `fill="none" stroke="${I}" stroke-width=".6" opacity=".5"`);
    for (let k = -5; k < 5; k++) s += `<rect x="${400 + k * 11}" y="${622}" width="10" height="${24 - Math.abs(k + .5) * 1.2}" rx="2" fill="${F}" stroke="${I}" stroke-width="1"/>`;
    s += L(300, 618, 500, 618, `stroke="${pal.red}" stroke-width="1.2"`);
    s += T(400, 830, 'STUDY FOR A FACE THAT REMAINS', `${MONO} font-size="11" letter-spacing="3" text-anchor="middle" fill="${I}" opacity=".7"`);
    return s;
  };

  /* =======================================================================
     CHAPTER IV — EXPERIMENTAL TYPOGRAPHY
     ======================================================================= */
  const TYPE = (size, extra = '') => `${GROT} font-weight="900" font-size="${size}" style="font-stretch:62%" ${extra}`;

  ART.illegible = ({ p, pal, r }) => {
    const I = pal.ink; let s = '';
    const lines = [['ILLE', 300], ['GIB—', 610], ['LE.', 920]];
    let base = lines.map(([t, y]) => `<text x="400" y="${y}" ${TYPE(330, `text-anchor="middle" textLength="740" lengthAdjust="spacingAndGlyphs"`)}>${t}</text>`).join('');
    s += `<defs><g id="${p}tx">${base}</g></defs>`;
    const SL = 22;
    for (let i = 0; i < SL; i++) {
      const y = i * 1000 / SL, h = 1000 / SL; const dx = r() < .45 ? (r() - .5) * 90 : 0; const red = r() < .07;
      s += `<clipPath id="${p}c${i}"><rect x="0" y="${n(y)}" width="800" height="${n(h + .5)}"/></clipPath><use href="#${p}tx" clip-path="url(#${p}c${i})" transform="translate(${n(dx)} 0)" fill="${red ? pal.red : I}"/>`;
    }
    for (let i = 0; i < 6; i++) s += `<rect x="${n(r() * 700)}" y="${n(r() * 1000)}" width="${n(30 + r() * 140)}" height="${n(2 + r() * 8)}" fill="${pal.bg || pal.fill}"/>`;
    s += T(30, 30, 'SPECIMEN: TYPE — Nº 001', `${MONO} font-size="11" letter-spacing="2" fill="${I}" opacity=".75"`);
    s += T(770, 985, 'READ AT YOUR OWN RISK', `${MONO} font-size="11" letter-spacing="2" text-anchor="end" fill="${pal.red}"`);
    return s;
  };

  ART.signal = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.bg || pal.fill; let s = '';
    for (let i = 0; i < 9; i++) {
      const y = 120 + i * 105, red = i === 5, filled = i === 4;
      s += `<text x="400" y="${y}" ${TYPE(150, `text-anchor="middle" textLength="${740 - Math.abs(i - 4) * 50}" lengthAdjust="spacingAndGlyphs" fill="${filled ? I : 'none'}" stroke="${red ? pal.red : I}" stroke-width="${filled ? 0 : 1.2}" opacity="${n(filled ? 1 : 1 - Math.abs(i - 4) * .2)}"`)}>NO SIGNAL</text>`;
    }
    for (let y = 0; y < 1000; y += 4) s += L(0, y, 800, y, `stroke="${F}" stroke-width="1.2" opacity=".55"`);
    for (let i = 0; i < 14; i++) { const y = r() * 1000; s += `<rect x="${n(r() * 400)}" y="${n(y)}" width="${n(100 + r() * 400)}" height="${n(3 + r() * 16)}" fill="${r() < .2 ? pal.red : F}" opacity="${r() < .2 ? .7 : 1}"/>`; }
    s += T(30, 985, 'CH. IV — TRANSMISSION LOST AT 03:17', `${MONO} font-size="11" letter-spacing="2" fill="${I}" opacity=".7"`);
    return s;
  };

  ART.misreg = ({ p, pal, r }) => {
    const I = pal.ink; let s = '';
    s += `<rect width="800" height="1000" fill="url(#${p}grid)" opacity=".08"/>`;
    const letters = 'VELOURGHOST'.split('');
    letters.forEach((ch, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = 140 + col * 260 + (r() - .5) * 50, y = 230 + row * 230 + (r() - .5) * 40, rot = (r() - .5) * 24, size = 220 + r() * 120;
      const outline = r() < .4;
      const t = (dx, dy, fill, extra) => `<text x="${n(x + dx)}" y="${n(y + dy)}" transform="rotate(${n(rot)} ${n(x)} ${n(y)})" ${TYPE(n(size), `text-anchor="middle" ${extra}`)} fill="${fill}">${ch}</text>`;
      s += t(7, 4, pal.red, 'opacity=".75"');
      s += outline ? t(0, 0, 'none', `stroke="${I}" stroke-width="1.6"`) : t(0, 0, I, '');
    });
    s += `<g transform="translate(560 860)">${C(0, 0, 40, `fill="none" stroke="${pal.green}" stroke-width="6"`)}${pupil(0, 0, 4, 24, pal)}</g>`;
    s += T(30, 975, 'MISREGISTERED — 2 PLATES, 0 ALIGNMENT', `${MONO} font-size="11" letter-spacing="2" fill="${I}" opacity=".75"`);
    return s;
  };

  ART.letterform = ({ p, pal, r }) => {
    const I = pal.ink, F = pal.fill, cx = 400, cy = 540; let s = '';
    s += `<rect width="800" height="1000" fill="url(#${p}grid)" opacity=".07"/>`;
    [[300, 'ASCENDER'], [380, 'X-HEIGHT'], [700, 'BASELINE'], [780, 'DESCENDER']].forEach(([y, t], i) => s += L(40, y, 760, y, `stroke="${i === 2 ? pal.red : I}" stroke-width="${i === 2 ? 1.2 : .6}" ${i === 2 ? '' : 'stroke-dasharray="4 5"'} opacity=".75"`) + T(44, y - 6, t, `${MONO} font-size="9.5" letter-spacing="2" fill="${i === 2 ? pal.red : I}"`));
    s += C(cx, cy, 250, `fill="none" stroke="${I}" stroke-width=".5" opacity=".5"`) + L(cx, 240, cx, 840, `stroke="${I}" stroke-width=".5" opacity=".5"`) + L(100, cy, 700, cy, `stroke="${I}" stroke-width=".5" opacity=".5"`);
    const ring = `M${cx} ${cy - 160}C${cx + 126} ${cy - 160} ${cx + 156} ${cy - 76} ${cx + 156} ${cy}C${cx + 156} ${cy + 76} ${cx + 126} ${cy + 160} ${cx} ${cy + 160}C${cx - 126} ${cy + 160} ${cx - 156} ${cy + 76} ${cx - 156} ${cy}C${cx - 156} ${cy - 76} ${cx - 126} ${cy - 160} ${cx} ${cy - 160}Z`;
    const hole = `M${cx} ${cy - 112}C${cx + 78} ${cy - 112} ${cx + 96} ${cy - 56} ${cx + 96} ${cy}C${cx + 96} ${cy + 56} ${cx + 78} ${cy + 112} ${cx} ${cy + 112}C${cx - 78} ${cy + 112} ${cx - 96} ${cy + 56} ${cx - 96} ${cy}C${cx - 96} ${cy - 56} ${cx - 78} ${cy - 112} ${cx} ${cy - 112}Z`;
    s += `<g ${pal.glow ? `filter="url(#${p}glow)"` : ''}><path d="${ring}${hole}" fill="${pal.green}" fill-rule="evenodd" opacity="${pal.glow ? .92 : .85}"/></g>`;
    s += E(cx, cy, 14, 84, `fill="${BLACK}"`) + E(cx, cy, 3, 70, `fill="${pal.green}" class="vg-eye" opacity=".9"`);
    [[cx, cy - 160, cx + 126, cy - 160], [cx + 156, cy, cx + 156, cy - 76], [cx, cy + 112, cx - 78, cy + 112], [cx - 156, cy, cx - 156, cy + 76]].forEach(([a, b, c, d]) => s += L(a, b, c, d, `stroke="${I}" stroke-width=".8"`) + `<rect x="${a - 4}" y="${b - 4}" width="8" height="8" fill="${F}" stroke="${I}"/>` + C(c, d, 4, `fill="${F}" stroke="${I}"`));
    s += L(cx - 156, 880, cx + 156, 880, `stroke="${I}" stroke-width=".7"`) + T(cx, 900, '312 UNITS', `${MONO} font-size="9.5" letter-spacing="2" text-anchor="middle" fill="${I}"`);
    s += T(40, 70, 'LETTERFORM 004', `${GROT} font-weight="900" font-size="44" style="font-stretch:62%" fill="${I}"`) + T(40, 96, 'THE EYE — LOWERCASE o, VELOUR GHOST REGULAR', `${MONO} font-size="10" letter-spacing="2" fill="${I}" opacity=".7"`);
    return s;
  };

  /* =======================================================================
     RENDERING
     ======================================================================= */
  function render(key, o = {}) {
    const fn = ART[key] || ART.masquerade;
    const pal = typeof o.pal === 'object' ? o.pal : PALETTES[o.pal || 'dark'];
    const p = 'vg' + (++UID) + '_';
    const r = rng(seedOf(key) + (o.seed || 0) * 7919);
    let body = fn({ p, pal, r, o });
    body = body.replace(/__P__/g, p);
    const misreg = o.mis !== false && !!pal.bg;
    let out = `<defs>${defs(p, pal)}<g id="${p}m">${body}</g></defs>`;
    if (pal.bg) out += `<rect x="-20" y="-20" width="840" height="1040" fill="${pal.bg}"/>`;
    if (misreg) out += `<use href="#${p}m" transform="translate(3.2 1.4)" filter="url(#${p}red)"/>`;
    out += `<use href="#${p}m" ${o.rough ? `filter="url(#${p}rough)"` : ''}/>`;
    if (pal.bg && o.vig !== false) out += `<rect width="800" height="1000" fill="url(#${p}vig)"/>`;
    if (o.inner) return out;
    const vb = o.viewBox || '0 0 800 1000';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="${o.par || 'xMidYMid slice'}" class="vg-art ${o.cls || ''}" role="img" aria-label="${esc(o.label || key)}" ${o.attrs || ''}>${out}</svg>`;
  }

  /* ---------- garments ---------- */
  const FABRIC = {
    black: { fabric: '#141313', seam: '#2a2827', print: { bg: null, fill: '#141313', ink: BONE, red: '#a3151f', green: GREEN, glow: true }, name: 'Absolute Black' },
    bone:  { fabric: '#E3DACA', seam: '#c9bfae', print: { bg: null, fill: '#E3DACA', ink: '#17110f', red: RED, green: '#2d6e4a', glow: false }, name: 'Aged Bone' },
    blood: { fabric: '#3d0a0e', seam: '#5a1218', print: { bg: null, fill: '#3d0a0e', ink: BONE, red: '#e8e0d2', green: GREEN, glow: true }, name: 'Dried Blood' }
  };
  const SHAPES = {
    tee: { front: 'M212 64Q300 118 388 64L470 84L584 176L530 258L470 222L470 682Q300 694 130 682L130 222L70 258L16 176L130 84Z', back: 'M212 64Q300 84 388 64L470 84L584 176L530 258L470 222L470 682Q300 694 130 682L130 222L70 258L16 176L130 84Z', print: [178, 150, 244, 305], neck: 'M212 64Q300 118 388 64M220 66Q300 128 380 66' },
    longsleeve: { front: 'M214 64Q300 116 386 64L466 84Q520 104 540 170L586 600L536 610L486 260L470 250L470 682Q300 694 130 682L130 250L114 260L64 610L14 600L60 170Q80 104 134 84Z', back: 'M214 64Q300 82 386 64L466 84Q520 104 540 170L586 600L536 610L486 260L470 250L470 682Q300 694 130 682L130 250L114 260L64 610L14 600L60 170Q80 104 134 84Z', print: [180, 150, 240, 300], neck: 'M214 64Q300 116 386 64M222 66Q300 126 378 66' },
    hoodie: { front: 'M196 74Q300 128 404 74L484 102Q544 132 556 222L584 586L522 596L490 300L486 662Q300 678 114 662L110 300L78 596L16 586L44 222Q56 132 116 102Z', back: 'M196 74Q300 96 404 74L484 102Q544 132 556 222L584 586L522 596L490 300L486 662Q300 678 114 662L110 300L78 596L16 586L44 222Q56 132 116 102Z', print: [186, 150, 228, 285], hood: 'M196 74Q186 8 300 2Q414 8 404 74Q300 132 196 74Z', pocket: 'M186 470H414L444 604H156Z' },
    jacket: { front: 'M206 70Q300 104 394 70L474 92Q530 116 546 190L584 610L530 620L486 280L478 270L478 690L122 690L122 270L114 280L70 620L16 610L54 190Q70 116 126 92Z', back: 'M206 70Q300 90 394 70L474 92Q530 116 546 190L584 610L530 620L486 280L478 270L478 690L122 690L122 270L114 280L70 620L16 610L54 190Q70 116 126 92Z', print: [320, 170, 130, 162], collar: 'M206 70L240 34H360L394 70L340 120L300 100L260 120Z' }
  };

  function garment(prod, side = 'front', color = 'black') {
    const fab = FABRIC[color] || FABRIC.black; const sh = SHAPES[prod.garment] || SHAPES.tee;
    const p = 'gm' + (++UID) + '_'; const path = sh[side];
    let s = `<defs><clipPath id="${p}c"><path d="${path}"/></clipPath>
<pattern id="${p}w" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0H3M0 0V3" stroke="${color === 'bone' ? '#000' : '#fff'}" stroke-width=".35" opacity=".5"/></pattern>
<linearGradient id="${p}sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
<radialGradient id="${p}hl" cx=".45" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity="${color === 'bone' ? .18 : .06}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="${p}ds" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs>`;
    s += `<ellipse cx="300" cy="700" rx="230" ry="16" fill="#000" opacity=".7" filter="url(#${p}ds)"/>`;
    if (sh.hood && side === 'front') s += `<path d="${sh.hood}" fill="${fab.seam}"/><path d="M212 76Q300 120 388 76Q380 30 300 26Q220 30 212 76Z" fill="#000" opacity=".55"/>`;
    if (sh.hood && side === 'back') s += `<path d="M190 80Q170 0 300 -4Q430 0 410 80Q420 190 300 214Q180 190 190 80Z" fill="${fab.fabric}" stroke="${fab.seam}" stroke-width="2"/>`;
    s += `<path d="${path}" fill="${fab.fabric}"/>`;
    let g = '';
    const [px, py, pw, ph] = sh.print;
    if (side === 'front') {
      g += `<svg x="${px}" y="${py}" width="${pw}" height="${ph}" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet">${render(prod.art, { pal: fab.print, inner: true, seed: prod.seed || 0, mis: false, variant: prod.variant, jar: prod.jarLabel })}</svg>`;
      if (prod.garment === 'jacket') g += `<text x="140" y="200" font-family="Archivo,sans-serif" font-weight="800" font-size="13" letter-spacing="3" fill="${fab.print.ink}" style="font-stretch:75%">VELOUR GHOST</text><text x="140" y="216" font-family="'JetBrains Mono',monospace" font-size="8" letter-spacing="1.5" fill="${fab.print.red}">${esc(prod.code)}</text>`;
    } else {
      g += backPrint(prod, fab);
    }
    g += `<path d="${path}" fill="url(#${p}w)" opacity=".18"/><rect width="600" height="720" fill="url(#${p}sh)"/><rect width="600" height="720" fill="url(#${p}hl)"/>`;
    g += `<path d="M150 300Q170 420 160 640M450 290Q430 430 444 650M300 240Q290 400 306 660" fill="none" stroke="#000" stroke-width="18" opacity="${color === 'bone' ? .025 : .07}"/>`;
    s += `<g clip-path="url(#${p}c)">${g}</g>`;
    s += `<path d="${path}" fill="none" stroke="${fab.seam}" stroke-width="1.6"/>`;
    s += `<path d="M134 668Q300 680 466 668" fill="none" stroke="${fab.seam}" stroke-width="1" stroke-dasharray="3 3"/>`;
    if (sh.neck && side === 'front') s += `<path d="${sh.neck}" fill="none" stroke="${fab.seam}" stroke-width="3"/>`;
    if (sh.pocket && side === 'front') s += `<path d="${sh.pocket}" fill="none" stroke="${fab.seam}" stroke-width="2"/><path d="M262 104L258 250M338 104L342 250" stroke="${fab.seam}" stroke-width="3" fill="none"/><circle cx="258" cy="252" r="3" fill="${fab.seam}"/><circle cx="342" cy="252" r="3" fill="${fab.seam}"/>`;
    if (sh.collar && side === 'front') s += `<path d="${sh.collar}" fill="${fab.fabric}" stroke="${fab.seam}" stroke-width="2"/><path d="M300 100V690" stroke="${fab.seam}" stroke-width="3"/><path d="M300 100V690" stroke="${fab.print.ink}" stroke-width=".6" stroke-dasharray="2 2" opacity=".5"/><path d="M150 360H250V440H150ZM350 360H450V440H350Z" fill="none" stroke="${fab.seam}" stroke-width="1.6"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -10 600 730" class="vg-garment" role="img" aria-label="${esc(prod.name)} — ${side} view, ${fab.name}">${s}</svg>`;
  }

  function backPrint(prod, fab) {
    const I = fab.print.ink, R = fab.print.red; const sh = SHAPES[prod.garment] || SHAPES.tee;
    const big = prod.garment === 'jacket';
    let s = '';
    if (big) {
      s += `<svg x="130" y="140" width="340" height="425" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet">${render(prod.art, { pal: fab.print, inner: true, seed: prod.seed || 0, mis: false, variant: prod.variant })}</svg>`;
      s += `<text x="300" y="610" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="900" font-size="34" letter-spacing="2" fill="${I}" style="font-stretch:62%" textLength="300" lengthAdjust="spacingAndGlyphs">${esc(prod.name.toUpperCase())}</text>`;
      s += `<text x="300" y="632" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="9" letter-spacing="3" fill="${R}">${esc(prod.code)} — BEAUTY IN THE SHADOWS, BUT CLASSY.</text>`;
      return s;
    }
    s += `<text x="300" y="150" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="900" font-size="40" fill="${I}" style="font-stretch:62%" textLength="210" lengthAdjust="spacingAndGlyphs">VELOUR GHOST</text>`;
    s += `<text x="300" y="168" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8" letter-spacing="3" fill="${I}" opacity=".8">AN EXPERIMENTAL FASHION HOUSE</text>`;
    s += `<line x1="200" y1="180" x2="400" y2="180" stroke="${I}" stroke-width=".8"/>`;
    s += `<svg x="236" y="196" width="128" height="160" viewBox="200 200 400 500" preserveAspectRatio="xMidYMid slice">${render(prod.art, { pal: fab.print, inner: true, seed: prod.seed || 0, mis: false, variant: prod.variant })}</svg>`;
    s += `<rect x="236" y="196" width="128" height="160" fill="none" stroke="${I}" stroke-width=".8"/>`;
    s += `<text x="300" y="388" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="16" letter-spacing="2" fill="${I}" style="font-stretch:70%">${esc(prod.name.toUpperCase())}</text>`;
    s += `<text x="300" y="406" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="8" letter-spacing="2" fill="${R}">${esc(prod.code)}</text>`;
    s += `<text x="300" y="470" text-anchor="middle" font-family="'Bodoni Moda',serif" font-style="italic" font-size="13" fill="${I}" opacity=".85">Beauty in the shadows, but classy.</text>`;
    return s;
  }

  function detail(prod, color = 'black') {
    const fab = FABRIC[color] || FABRIC.black; const p = 'dt' + (++UID) + '_';
    const vb = (prod.detail || [240, 220, 320, 320]).join(' ');
    let s = `<defs><pattern id="${p}w" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H4M1 0V4" stroke="${color === 'bone' ? '#000' : '#fff'}" stroke-width=".6" opacity=".5"/></pattern>
<filter id="${p}crack" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="3" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 4.1" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>`;
    s += `<rect width="800" height="800" fill="${fab.fabric}"/>`;
    s += `<g filter="url(#${p}crack)"><svg width="800" height="800" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${render(prod.art, { pal: fab.print, inner: true, seed: prod.seed || 0, mis: false, variant: prod.variant, jar: prod.jarLabel })}</svg></g>`;
    s += `<rect width="800" height="800" fill="url(#${p}w)" opacity=".22"/>`;
    s += `<path d="M0 712H800" stroke="${fab.seam}" stroke-width="22"/><path d="M0 704H800M0 720H800" stroke="${fab.print.ink}" stroke-width="1.4" stroke-dasharray="7 5" opacity=".55"/>`;
    s += `<g transform="translate(560 650) rotate(-2)"><rect width="200" height="44" fill="#0a0a0a" stroke="#2a2a2a"/><text x="100" y="20" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="12" letter-spacing="3" fill="${BONE}" style="font-stretch:70%">VELOUR GHOST</text><text x="100" y="35" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="7.5" letter-spacing="1.5" fill="${GREEN}">${esc(prod.code)} · ED. OF ${prod.edition}</text></g>`;
    s += `<radialGradient id="${p}v" cx=".5" cy=".5" r=".7"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient><rect width="800" height="800" fill="url(#${p}v)"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" class="vg-detail" role="img" aria-label="${esc(prod.name)} — close-up of print and fabric">${s}</svg>`;
  }

  /* ---------- brand mark ---------- */
  function mark(o = {}) {
    const p = 'mk' + (++UID) + '_';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="vg-mark ${o.cls || ''}" aria-hidden="true"><defs><filter id="${p}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${o.blur || 3}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#${p}g)"><path d="M50 14C75 14 84 32 84 50C84 68 75 86 50 86C25 86 16 68 16 50C16 32 25 14 50 14ZM50 28C35 28 30 39 30 50C30 61 35 72 50 72C65 72 70 61 70 50C70 39 65 28 50 28Z" fill="${GREEN}" fill-rule="evenodd"/></g><ellipse class="vg-mark__slit" cx="50" cy="50" rx="3.2" ry="15" fill="${GREEN}"/></svg>`;
  }

  window.VGArt = { render, garment, detail, mark, FABRIC, keys: Object.keys(ART) };
})();
