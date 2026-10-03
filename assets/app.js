/*
  Pantograph Layout site: hero demo (autoplay + scrubber + graph), live
  calculation, comparison tabs, copy buttons and the language menu.
  The demo geometry is in mockup px, applied as rem, so it scales with the page.
*/
(function () {
  'use strict';

  var dataEl = document.getElementById('page-data');
  var DATA = dataEl ? JSON.parse(dataEl.textContent) : { dec: '.', bp: {}, mini: {} };
  var DEC = DATA.dec || '.';
  var root = document.documentElement;

  /* ------------------------------------------------------------ the math */

  var BPS = [
    { key: 'm', min: 320, max: 500, bp: 375 },
    { key: 't', min: 500, max: 1152, bp: 768 },
    { key: 'd', min: 1152, max: 1600, bp: 1440 }
  ];

  function bpFor(vw) { return vw >= 1152 ? BPS[2] : (vw >= 500 ? BPS[1] : BPS[0]); }

  function calc(vw) {
    var b = bpFor(vw);
    var minF = b.min / b.bp;
    var maxF = b.max / b.bp;
    var slope = (maxF - minF) / (b.max - b.min);
    var fluid = slope * (vw - b.min) + minF;
    var fs = Math.min(maxF, Math.max(minF, fluid));
    return { b: b, minF: minF, maxF: maxF, slope: slope, fluid: fluid, fs: fs };
  }

  function num(n, d) {
    var s = n.toFixed(d);
    return DEC === ',' ? s.replace('.', ',') : s;
  }

  /* One sweep 320 → 1920, a pause, then again from 320. */
  var KEYS = [[0, 320], [2400, 499], [2900, 499], [2900, 500], [6900, 1151], [7400, 1151], [7400, 1152], [10400, 1600], [12000, 1920], [14000, 1920]];
  var TOTAL = 14000;
  var SWEEP_END = 12000;

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function vwAt(t) {
    for (var i = 0; i < KEYS.length - 1; i++) {
      var a = KEYS[i], c = KEYS[i + 1];
      if (t >= a[0] && t < c[0]) {
        return Math.round(a[1] + (c[1] - a[1]) * ease((t - a[0]) / (c[0] - a[0])));
      }
    }
    return 1920;
  }

  function tFor(vw) {
    if (vw >= 1920 || vw <= 320) return 0;
    var lo = 0, hi = SWEEP_END;
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2;
      if (vwAt(mid) < vw) lo = mid; else hi = mid;
    }
    return hi;
  }

  function clampVw(v) {
    v = Math.round(Number(v));
    if (isNaN(v)) v = 412;
    return Math.max(320, Math.min(1920, v));
  }

  function remPx() { return parseFloat(getComputedStyle(root).fontSize) || 1; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /* ------------------------------------------------------------ demo mockups (px) */

  var M = DATA.mini || {};
  var TONES = [
    { bg: '#D1D5ED', dot: '#8377F1' },
    { bg: '#E6E6E6', dot: '#000000' },
    { bg: '#CAD3EE', dot: '#ffffff' },
    { bg: '#8377F1', dot: '#D1D5ED' }
  ];

  function hotel(i) { return (M.hotels && M.hotels[i]) || { n: '', m: '', p: '' }; }

  function miniMobile(w) {
    var cards = '';
    for (var i = 0; i < 3; i++) {
      var h = hotel(i), tone = TONES[i];
      cards += '<div style="display:flex;gap:14px;align-items:center;padding:12px;border:1px solid #E6E6E6;border-radius:16px">' +
        '<div style="width:92px;height:92px;flex-shrink:0;border-radius:12px;background:' + tone.bg + ';position:relative;overflow:hidden"><div style="position:absolute;width:60px;height:60px;border-radius:50%;background:' + tone.dot + ';bottom:-20px;right:-14px"></div></div>' +
        '<div style="display:flex;flex-direction:column;gap:4px"><div style="font-size:16px;font-weight:500">' + esc(h.n) + '</div><div style="font-size:13px;color:#3d3d3d">' + esc(h.m) + '</div><div style="font-size:16px;font-weight:700">' + esc(h.p) + '</div></div></div>';
    }
    return '<div style="width:' + w + 'px;height:900px;background:#fff;color:#000;font-family:var(--font);display:flex;flex-direction:column;overflow:hidden;line-height:1.3">' +
      '<div style="height:60px;flex-shrink:0;padding:0 12px 0 20px;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:10px"><div style="width:28px;height:28px;border-radius:50%;background:#8377F1"></div><div style="font-size:17px;font-weight:500">' + esc(M.brand) + '</div></div>' +
        '<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>' +
      '</div>' +
      '<div style="margin:0 20px;height:208px;flex-shrink:0;border-radius:20px;background:#8377F1;position:relative;overflow:hidden;padding:20px;display:flex;flex-direction:column;justify-content:flex-end">' +
        '<div style="position:absolute;width:190px;height:190px;border-radius:50%;background:#D1D5ED;top:-56px;right:-48px"></div>' +
        '<div style="position:absolute;width:40px;height:40px;border-radius:50%;background:#000;top:40px;right:120px"></div>' +
        '<div style="position:relative;font-size:34px;font-weight:700;line-height:1">' + esc(M.city) + '</div>' +
        '<div style="position:relative;font-size:15px;margin-top:8px">' + esc(M.dates) + '</div>' +
      '</div>' +
      '<div style="padding:16px 20px 0;display:flex;flex-direction:column;gap:10px">' +
        '<div style="height:52px;border:1.5px solid #000;border-radius:12px;padding:0 16px;display:flex;align-items:center;font-size:16px;color:#5c5c5c">' + esc(M.where) + '</div>' +
        '<div style="display:flex;gap:10px"><div style="flex-grow:1;height:52px;border:1.5px solid #000;border-radius:12px;padding:0 16px;display:flex;align-items:center;font-size:16px">' + esc(M.d1) + '</div><div style="flex-grow:1;height:52px;border:1.5px solid #000;border-radius:12px;padding:0 16px;display:flex;align-items:center;font-size:16px">' + esc(M.d2) + '</div></div>' +
        '<div style="height:52px;border-radius:12px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500">' + esc(M.search) + '</div>' +
      '</div>' +
      '<div style="padding:28px 20px 12px;font-size:21px;font-weight:700">' + esc(M.popular) + '</div>' +
      '<div style="padding:0 20px;display:flex;flex-direction:column;gap:12px">' + cards + '</div>' +
    '</div>';
  }

  function gridCards(n, imgH, nameSize, metaSize, gap, radius, dot) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var h = hotel(i), tone = TONES[i];
      out += '<div style="display:flex;flex-direction:column;gap:' + gap + 'px">' +
        '<div style="height:' + imgH + 'px;border-radius:' + radius + 'px;background:' + tone.bg + ';position:relative;overflow:hidden;margin-bottom:6px"><div style="position:absolute;width:' + dot + 'px;height:' + dot + 'px;border-radius:50%;background:' + tone.dot + ';bottom:-' + Math.round(dot / 3) + 'px;right:-' + Math.round(dot / 5) + 'px"></div></div>' +
        '<div style="font-size:' + nameSize + 'px;font-weight:500">' + esc(h.n) + '</div>' +
        '<div style="font-size:' + metaSize + 'px;color:#3d3d3d">' + esc(h.m) + '</div>' +
        '<div style="font-size:' + nameSize + 'px;font-weight:700">' + esc(h.p) + '</div></div>';
    }
    return out;
  }

  function navLinks(size, gap) {
    var nav = M.nav || [];
    var out = '';
    for (var i = 0; i < nav.length; i++) out += '<span style="font-size:' + size + 'px">' + esc(nav[i]) + '</span>';
    return '<div style="display:flex;align-items:center;gap:' + gap + 'px">' + out;
  }

  function miniTablet() {
    var nav = (M.nav || []).slice(0, 3);
    var links = '';
    for (var i = 0; i < nav.length; i++) links += '<span style="font-size:16px">' + esc(nav[i]) + '</span>';
    return '<div style="width:768px;height:900px;background:#fff;color:#000;font-family:var(--font);display:flex;flex-direction:column;overflow:hidden;line-height:1.3">' +
      '<div style="height:80px;flex-shrink:0;padding:0 32px;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:12px"><div style="width:32px;height:32px;border-radius:50%;background:#8377F1"></div><div style="font-size:20px;font-weight:500">' + esc(M.brand) + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:28px">' + links + '<span style="height:44px;padding:0 18px;border:1.5px solid #000;border-radius:10px;display:flex;align-items:center;font-size:16px">' + esc(M.login) + '</span></div>' +
      '</div>' +
      '<div style="margin:0 32px;height:300px;flex-shrink:0;border-radius:24px;background:#8377F1;position:relative;overflow:hidden;padding:32px 32px 68px;display:flex;flex-direction:column;justify-content:flex-end">' +
        '<div style="position:absolute;width:300px;height:300px;border-radius:50%;background:#D1D5ED;top:-90px;right:-60px"></div>' +
        '<div style="position:absolute;width:60px;height:60px;border-radius:50%;background:#000;top:56px;right:250px"></div>' +
        '<div style="position:relative;font-size:56px;font-weight:700;line-height:1">' + esc(M.city) + '</div>' +
        '<div style="position:relative;font-size:18px;margin-top:12px">' + esc(M.dates) + '</div>' +
      '</div>' +
      '<div style="margin:-36px 56px 0;position:relative;flex-shrink:0;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.14);padding:12px;display:flex;gap:10px">' +
        '<div style="flex-grow:1;height:52px;border:1.5px solid #000;border-radius:12px;padding:0 16px;display:flex;align-items:center;font-size:16px;color:#5c5c5c">' + esc(M.where) + '</div>' +
        '<div style="width:150px;height:52px;border:1.5px solid #000;border-radius:12px;padding:0 16px;display:flex;align-items:center;font-size:16px">' + esc(M.dShort) + '</div>' +
        '<div style="width:150px;height:52px;border-radius:12px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500">' + esc(M.searchShort) + '</div>' +
      '</div>' +
      '<div style="padding:40px 32px 16px;font-size:28px;font-weight:700">' + esc(M.popular) + '</div>' +
      '<div style="padding:0 32px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px">' + gridCards(4, 170, 18, 14, 6, 16, 110) + '</div>' +
    '</div>';
  }

  function miniDesktop() {
    return '<div style="width:1440px;height:900px;background:#fff;color:#000;font-family:var(--font);display:flex;flex-direction:column;overflow:hidden;line-height:1.3">' +
      '<div style="height:96px;flex-shrink:0;padding:0 80px;display:flex;align-items:center;justify-content:space-between">' +
        '<div style="display:flex;align-items:center;gap:14px"><div style="width:36px;height:36px;border-radius:50%;background:#8377F1"></div><div style="font-size:22px;font-weight:500">' + esc(M.brand) + '</div></div>' +
        navLinks(18, 40) + '<span style="height:48px;padding:0 24px;border:1.5px solid #000;border-radius:12px;display:flex;align-items:center;font-size:18px">' + esc(M.login) + '</span></div>' +
      '</div>' +
      '<div style="margin:0 80px;height:400px;flex-shrink:0;border-radius:32px;background:#8377F1;position:relative;overflow:hidden;padding:56px 56px 92px;display:flex;flex-direction:column;justify-content:flex-end">' +
        '<div style="position:absolute;width:480px;height:480px;border-radius:50%;background:#D1D5ED;top:-140px;right:-40px"></div>' +
        '<div style="position:absolute;width:96px;height:96px;border-radius:50%;background:#000;top:80px;right:480px"></div>' +
        '<div style="position:absolute;width:180px;height:180px;border-radius:50%;border:2px solid #000;bottom:-60px;right:300px"></div>' +
        '<div style="position:relative;font-size:88px;font-weight:700;line-height:1">' + esc(M.city) + '</div>' +
        '<div style="position:relative;font-size:22px;margin-top:16px">' + esc(M.dates) + '</div>' +
      '</div>' +
      '<div style="margin:-44px 136px 0;position:relative;flex-shrink:0;background:#fff;border-radius:20px;box-shadow:0 10px 32px rgba(0,0,0,.14);padding:14px;display:flex;gap:12px">' +
        '<div style="flex-grow:1;height:60px;border:1.5px solid #000;border-radius:14px;padding:0 20px;display:flex;align-items:center;font-size:18px;color:#5c5c5c">' + esc(M.where) + '</div>' +
        '<div style="width:220px;height:60px;border:1.5px solid #000;border-radius:14px;padding:0 20px;display:flex;align-items:center;font-size:18px">' + esc(M.dLong) + '</div>' +
        '<div style="width:160px;height:60px;border:1.5px solid #000;border-radius:14px;padding:0 20px;display:flex;align-items:center;font-size:18px">' + esc(M.guests) + '</div>' +
        '<div style="width:200px;height:60px;border-radius:14px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500">' + esc(M.search) + '</div>' +
      '</div>' +
      '<div style="padding:56px 80px 20px;font-size:36px;font-weight:700">' + esc(M.popular) + '</div>' +
      '<div style="padding:0 80px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px">' + gridCards(4, 220, 20, 15, 8, 20, 140) + '</div>' +
    '</div>';
  }

  var MINI_HTML = {};
  function miniFor(key) {
    if (!MINI_HTML[key]) MINI_HTML[key] = key === 'm' ? miniMobile(375) : (key === 't' ? miniTablet() : miniDesktop());
    return MINI_HTML[key];
  }

  /* ------------------------------------------------------------ hero demo */

  var GEO = {
    m: { vL: 320, xL: 28, xR: 325, W: 335, frame: false, frameH: 0, graphTop: 0, graphH: 150, yT: 8, yB: 124, labelY: 130, sliderTop: 150, stageH: 194, yRight: 313, seg: false, ticks: [320, 500, 768, 1152, 1440, 1920] },
    t: { vL: 0, xL: 0, xR: 704, W: 704, frame: true, frameH: 200, graphTop: 212, graphH: 150, yT: 22, yB: 122, labelY: 128, sliderTop: 362, stageH: 406, yRight: 595, seg: true, ticks: [320, 500, 768, 1152, 1440, 1600, 1920] },
    d: { vL: 0, xL: 0, xR: 1280, W: 1280, frame: true, frameH: 220, graphTop: 232, graphH: 160, yT: 26, yB: 136, labelY: 142, sliderTop: 392, stageH: 436, yRight: 1077, seg: true, ticks: [320, 500, 768, 1152, 1440, 1600, 1920] }
  };
  var F_LO = 0.6, F_HI = 1.55;
  var Y_TICKS = [0.8, 1, 1.2, 1.4];
  var SEGS = [[320, 500, 375], [500, 1152, 768], [1152, 1600, 1440]];
  var TOP = 1600 / 1440;

  var mqT = window.matchMedia('(min-width: 500px)');
  var mqD = window.matchMedia('(min-width: 1152px)');
  function layoutKey() { return mqD.matches ? 'd' : (mqT.matches ? 't' : 'm'); }

  var stage = document.querySelector('[data-stage]');
  if (!stage) return;
  var frame = document.querySelector('[data-frame]');
  var screen = document.querySelector('[data-screen]');
  var graph = document.querySelector('[data-graph]');
  var svg = document.querySelector('[data-svg]');
  var labels = document.querySelector('[data-labels]');
  var bandsBox = document.querySelector('[data-bands]');
  var marker = document.querySelector('[data-marker]');
  var markerDot = document.querySelector('[data-marker-dot]');
  var scrub = document.querySelector('[data-scrub]');
  var playBtn = document.querySelector('[data-play]');
  var playLabel = document.querySelector('[data-play-label]');
  var aa = document.querySelector('[data-aa]');
  var clampedNote = document.querySelector('[data-clamped]');
  var paths = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-path]'), function (p) { paths[p.getAttribute('data-path')] = p; });
  var outs = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-out]'), function (el) {
    var k = el.getAttribute('data-out');
    (outs[k] = outs[k] || []).push(el);
  });
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll('[data-presets] button'));

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { vw: 412, playing: !reduceMotion, t: tFor(412), last: null, key: null, miniKey: null, rem: remPx() };

  function geo() { return GEO[state.key]; }
  function X(v) { var g = geo(); return g.xL + (v - g.vL) / (1920 - g.vL) * (g.xR - g.xL); }
  function Y(f) { var g = geo(); return g.yB - (f - F_LO) / (F_HI - F_LO) * (g.yB - g.yT); }
  function f1(n) { return n.toFixed(1); }
  function line(a, fa, b, fb) { return 'M' + f1(X(a)) + ' ' + f1(Y(fa)) + ' L' + f1(X(b)) + ' ' + f1(Y(fb)); }

  function setText(key, value) {
    var list = outs[key];
    if (!list) return;
    for (var i = 0; i < list.length; i++) if (list[i].textContent !== value) list[i].textContent = value;
  }

  function layout() {
    state.key = layoutKey();
    var g = geo();
    stage.style.height = g.stageH + 'rem';

    frame.style.height = g.frameH + 'rem';
    graph.style.top = g.graphTop + 'rem';
    graph.style.width = g.W + 'rem';
    graph.style.height = g.graphH + 'rem';
    svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.graphH);
    svg.style.width = g.W + 'rem';
    svg.style.height = g.graphH + 'rem';

    var full = SEGS.map(function (s) { return line(s[0], s[0] / s[2], s[1], s[1] / s[2]); });
    full.push(line(1600, TOP, 1920, TOP));
    paths.full.setAttribute('d', full.join(' '));
    paths.grid.setAttribute('d', Y_TICKS.map(function (f) { return 'M' + f1(X(320)) + ' ' + f1(Y(f)) + ' L' + f1(X(1920)) + ' ' + f1(Y(f)); }).join(' '));
    paths.borders.setAttribute('d', [500, 1152, 1600].map(function (v) { return 'M' + f1(X(v)) + ' ' + g.yT + ' L' + f1(X(v)) + ' ' + g.yB; }).join(' '));
    paths.one.setAttribute('d', 'M' + f1(X(320)) + ' ' + f1(Y(1)) + ' L' + f1(X(1920)) + ' ' + f1(Y(1)));
    paths.dots.setAttribute('d', [375, 768, 1440].map(function (v) {
      var cx = X(v), cy = Y(1);
      return 'M' + f1(cx - 4) + ' ' + f1(cy) + ' a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0';
    }).join(' '));
    markerDot.setAttribute('r', state.key === 'd' ? 7 : 6);

    var html = '';
    g.ticks.forEach(function (v, i, arr) {
      var tx = i === arr.length - 1 ? 'translateX(-100%)' : (i === 0 && state.key === 'm' ? 'translateX(-40%)' : 'translateX(-50%)');
      var mock = v === 375 || v === 768 || v === 1440;
      html += '<span class="gl gl--x' + (mock ? ' gl--mock' : '') + '" style="left:' + f1(X(v)) + 'rem;top:' + g.labelY + 'rem;transform:' + tx + '">' + v + '</span>';
    });
    Y_TICKS.forEach(function (f) {
      html += '<span class="gl gl--y" style="right:' + g.yRight + 'rem;top:' + f1(Y(f)) + 'rem">' + num(f, 1) + '</span>';
    });
    if (g.seg) {
      [['m', 410], ['t', 826], ['d', 1536]].forEach(function (s) {
        html += '<span class="gl gl--seg" style="left:' + f1(X(s[1])) + 'rem">' + esc(DATA.bp[s[0]]) + '</span>';
      });
    }
    labels.innerHTML = html;

    var bands = [[320, 500, '#8377F1', 2], [500, 1152, '#D1D5ED', 2], [1152, 1600, '#ffffff', 2], [1600, 1920, '#5c5c5c', 0]];
    bandsBox.innerHTML = bands.map(function (b) {
      return '<span class="band" style="top:' + (g.sliderTop + 19) + 'rem;left:' + f1(X(b[0])) + 'rem;width:' + f1(X(b[1]) - X(b[0]) - b[3]) + 'rem;background:' + b[2] + '"></span>';
    }).join('');

    scrub.style.left = f1(X(320) - 11) + 'rem';
    scrub.style.width = f1(X(1920) - X(320) + 22) + 'rem';
    scrub.style.top = g.sliderTop + 'rem';

    var mTop = g.frame ? g.frameH : 0;
    marker.style.top = mTop + 'rem';
    marker.style.height = (g.sliderTop + 22 - mTop) + 'rem';

    state.miniKey = null;
    update(true);
  }

  function update(force) {
    var vw = state.vw;
    var c = calc(vw);
    var g = geo();
    var b = c.b;

    var trail = [];
    SEGS.forEach(function (s) {
      var end = Math.min(s[1], vw);
      if (end > s[0]) trail.push(line(s[0], s[0] / s[2], end, end / s[2]));
    });
    if (vw > 1600) trail.push(line(1600, TOP, vw, TOP));
    paths.trail.setAttribute('d', trail.join(' ') || 'M0 0');
    markerDot.setAttribute('cx', f1(X(vw)));
    markerDot.setAttribute('cy', f1(Y(c.fs)));
    marker.style.left = f1(X(vw)) + 'rem';

    if (g.frame) {
      var D = g.W / 1920;
      if (state.miniKey !== b.key || force) {
        screen.innerHTML = miniFor(b.key);
        screen.style.width = b.bp + 'px';
        state.miniKey = b.key;
      }
      frame.style.width = f1(vw * D) + 'rem';
      screen.style.left = f1(Math.max(0, vw - b.bp * c.fs) / 2 * D) + 'rem';
      screen.style.transform = 'scale(' + (c.fs * D * state.rem).toFixed(5) + ')';
    }

    if (String(scrub.value) !== String(vw)) scrub.value = vw;

    var mn = num(c.minF, 3), mx = num(c.maxF, 3), sl = num(c.slope, 6), fl = num(c.fluid, 3), fs = num(c.fs, 3);
    setText('vw', String(vw));
    setText('bpName', DATA.bp[b.key] || '');
    setText('bpVw', String(b.bp));
    setText('rem', fs);
    setText('px24', num(24 * c.fs, 1));
    setText('vars', 'min-vw ' + b.min + ' · max-vw ' + b.max + ' · balance-point ' + b.bp);
    setText('minLine', b.min + ' / ' + b.bp + ' = ' + mn + ' px');
    setText('maxLine', b.max + ' / ' + b.bp + ' = ' + mx + ' px');
    setText('slopeLine', '(' + mx + ' − ' + mn + ') / (' + b.max + ' − ' + b.min + ') = ' + sl);
    setText('fluidLine', sl + ' × (' + vw + ' − ' + b.min + ') + ' + mn + ' = ' + fl + ' px');
    setText('clampLine', 'clamp(' + mn + ', ' + fl + ', ' + mx + ') = ' + fs + ' px');
    if (clampedNote) clampedNote.hidden = !(c.fluid > c.maxF + 1e-9);
    if (aa) aa.style.fontSize = (24 * c.fs).toFixed(1) + 'px';

    presetBtns.forEach(function (btn) {
      var on = !state.playing && Number(btn.getAttribute('data-vw')) === vw;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function setPlaying(on) {
    state.playing = on;
    playBtn.setAttribute('data-state', on ? 'playing' : 'paused');
    playLabel.textContent = on ? DATA.pause : DATA.play;
    if (on) {
      state.t = tFor(state.vw);
      state.last = null;
      requestAnimationFrame(tick);
    }
    update();
  }

  function setVw(v) {
    if (state.playing) {
      state.playing = false;
      playBtn.setAttribute('data-state', 'paused');
      playLabel.textContent = DATA.play;
    }
    state.vw = clampVw(v);
    update();
  }

  function tick(now) {
    if (!state.playing) { state.last = null; return; }
    if (state.last != null) {
      state.t = (state.t + Math.min(64, now - state.last)) % TOTAL;
      var v = vwAt(state.t);
      if (v !== state.vw) { state.vw = v; update(); }
    }
    state.last = now;
    requestAnimationFrame(tick);
  }

  scrub.addEventListener('input', function () { setVw(scrub.value); });
  playBtn.addEventListener('click', function () { setPlaying(!state.playing); });
  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setVw(btn.getAttribute('data-vw')); });
  });

  /* ------------------------------------------------------------ comparison */

  var cmp = document.querySelector('[data-cmp]');
  var minis = Array.prototype.slice.call(document.querySelectorAll('[data-mini]'));
  minis.forEach(function (el) {
    var px = el.getAttribute('data-mini') === '480px';
    el.innerHTML = miniMobile(px ? 480 : 375);
    el.style.width = (px ? 480 : 375) + 'px';
  });
  function scaleMinis() {
    minis.forEach(function (el) {
      var w = el.parentNode.clientWidth;
      if (!w) return;
      var base = el.getAttribute('data-mini') === '480px' ? 480 : 375;
      el.style.transform = 'scale(' + (w / base).toFixed(5) + ')';
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (tab, i, all) {
    tab.addEventListener('click', function () {
      cmp.setAttribute('data-active', tab.getAttribute('data-tab'));
      Array.prototype.forEach.call(all, function (t) { t.setAttribute('aria-pressed', t === tab ? 'true' : 'false'); });
      scaleMinis();
    });
  });

  /* ------------------------------------------------------------ copy buttons */

  var skillText = null;
  var skillBtn = document.querySelector('[data-copy="skill"]');
  if (skillBtn && window.fetch) {
    fetch(skillBtn.getAttribute('data-src')).then(function (r) { return r.ok ? r.text() : null; }).then(function (t) { skillText = t; }).catch(function () {});
  }

  function copyText(text, done) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {}
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.querySelector('span');
    var timer = null;
    function done() {
      label.textContent = btn.getAttribute('data-done');
      clearTimeout(timer);
      timer = setTimeout(function () { label.textContent = btn.getAttribute('data-label'); }, 2000);
    }
    btn.addEventListener('click', function () {
      if (btn.getAttribute('data-copy') === 'css') {
        copyText(document.getElementById('css-full').textContent, done);
      } else if (skillText) {
        copyText(skillText, done);
      } else if (window.fetch) {
        fetch(btn.getAttribute('data-src')).then(function (r) { return r.text(); }).then(function (t) { skillText = t; copyText(t, done); });
      }
    });
  });

  /* ------------------------------------------------------------ language menu */

  var langBtn = document.querySelector('[data-lang-btn]');
  var langMenu = document.querySelector('[data-lang-menu]');
  function closeLang() { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); }
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.hidden;
      langMenu.hidden = !open;
      langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var first = langMenu.querySelector('a'); if (first) first.focus(); }
    });
    document.addEventListener('click', function (e) { if (!langMenu.hidden && !langMenu.contains(e.target)) closeLang(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !langMenu.hidden) { closeLang(); langBtn.focus(); } });
  }

  /* ------------------------------------------------------------ start */

  function onResize() {
    var r = remPx();
    var key = layoutKey();
    if (key !== state.key) { state.rem = r; layout(); }
    else if (r !== state.rem) { state.rem = r; update(true); }
    scaleMinis();
  }
  window.addEventListener('resize', onResize);
  if (mqT.addEventListener) { mqT.addEventListener('change', onResize); mqD.addEventListener('change', onResize); }

  layout();
  scaleMinis();
  setPlaying(state.playing);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scaleMinis);
})();
