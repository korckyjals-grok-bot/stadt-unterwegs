/* Stadtplan: Geometrie, Routen-Simulation, Texte (du / Sie / es) und SVG. v1.0.2 */
(function (g) {
  'use strict';
  var D = g.STADT_DATA;
  var X = [100, 330, 560], Y = [130, 330, 530, 730], W = 660, H = 860;
  var DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  function dn(dx, dy) { for (var k in DIRS) if (DIRS[k][0] === dx && DIRS[k][1] === dy) return k; return null; }
  function leftOf(d) { var v = DIRS[d]; return dn(v[1], -v[0]); }
  function rightOf(d) { var v = DIRS[d]; return dn(-v[1], v[0]); }
  function sideDir(d, s) { return s === 'L' ? leftOf(d) : rightOf(d); }
  function inGrid(c, r) { return c >= 0 && c < X.length && r >= 0 && r < Y.length; }
  function has(c, r, d) { var v = DIRS[d]; return inGrid(c, r) && inGrid(c + v[0], r + v[1]); }
  function isAmpel(c, r) { return D.AMPELN.some(function (a) { return a[0] === c && a[1] === r; }); }
  function isCross(c, r, d) { return has(c, r, d) && has(c, r, leftOf(d)) && has(c, r, rightOf(d)); }
  function node(c, r) { return { x: X[c], y: Y[r] }; }
  /* Abschnitt ab Kreuzung (c,r) in Richtung d */
  function segOf(c, r, d) {
    if (d === 'E') return { o: 'H', r: r, s: c };
    if (d === 'W') return { o: 'H', r: r, s: c - 1 };
    if (d === 'S') return { o: 'V', c: c, s: r };
    return { o: 'V', c: c, s: r - 1 };
  }
  function segMid(sg) { return sg.o === 'H' ? { x: (X[sg.s] + X[sg.s + 1]) / 2, y: Y[sg.r] } : { x: X[sg.c], y: (Y[sg.s] + Y[sg.s + 1]) / 2 }; }
  function placesOn(sg) {
    if (sg.o !== 'H') return [];
    return D.PLACES.filter(function (p) { return p.map && p.map.r === sg.r && p.map.s === sg.s; });
  }
  /* Seite eines Ortes relativ zur Gehrichtung: L / R */
  function relSide(p, d) {
    if (d === 'E') return p.map.side === 'N' ? 'L' : 'R';
    if (d === 'W') return p.map.side === 'N' ? 'R' : 'L';
    return null;
  }
  function placeXY(p) {
    var m = p.map, cx = (X[m.s] + X[m.s + 1]) / 2;
    return { x: cx, y: Y[m.r] + (m.side === 'S' ? 49 : -49) };
  }
  function opposite(p) {
    if (!p.map) return null;
    return D.PLACES.filter(function (q) { return q.map && q.map.r === p.map.r && q.map.s === p.map.s && q.map.side !== p.map.side; })[0] || null;
  }

  /* Simulation einer Route. Liefert {ok, dest, err, pts, marks} */
  function simulate(route) {
    var sp = D.place(route.start);
    if (!sp || !sp.map) return { ok: false, err: 'start' };
    var h = route.h, m = sp.map;
    var st = { c: h === 'E' ? m.s : m.s + 1, r: m.r, d: h, mid: true };
    if (h !== 'E' && h !== 'W') return { ok: false, err: 'heading' };
    var start = segMid({ o: 'H', r: m.r, s: m.s });
    var pts = [start], marks = [], dest = null, acts = []; /* acts[i] = Kreuzung, an der Schritt i passiert */
    function fail(e, i) { return { ok: false, err: e, step: i, pts: pts, marks: marks }; }
    for (var i = 0; i < route.steps.length; i++) {
      var s = route.steps[i], v = DIRS[st.d];
      var c = st.c + v[0], r = st.r + v[1], guard = 0, nd;
      if (dest) return fail('after-dest', i);
      if (s.t === 'g') { var lp = pts[pts.length - 1]; marks.push({ x: lp.x + v[0] * 58, y: lp.y + v[1] * 58 }); continue; }
      if (s.t === 'z') {
        if (st.mid) return fail('dest-not-ahead', i);
        if (!has(st.c, st.r, st.d)) return fail('no-street', i);
        var sg = segOf(st.c, st.r, st.d);
        var cand = placesOn(sg).filter(function (p) { return relSide(p, st.d) === s.s; });
        if (cand.length !== 1) return fail('no-dest', i);
        dest = cand[0];
        var pm = segMid(sg); pts.push(pm); var dxy = placeXY(dest); marks.push({ x: dxy.x - pillW(dest) / 2, y: dxy.y - 20 });
        continue;
      }
      if (s.t === 'b') {
        var cc = st.mid ? c : st.c, rr = st.mid ? r : st.r, found = false;
        while (guard++ < 10) {
          if (!has(cc, rr, st.d)) break;
          var sg2 = segOf(cc, rr, st.d);
          if (placesOn(sg2).some(function (p) { return p.n === s.p; })) { found = true; break; }
          cc += v[0]; rr += v[1];
        }
        if (!found) return fail('until-not-found', i);
        st = { c: cc, r: rr, d: st.d, mid: true };
        var bp = D.place(s.p), bxy = placeXY(bp); marks.push({ x: bxy.x - pillW(bp) / 2, y: bxy.y - 20 });
        continue;
      }
      if (!st.mid) { c = st.c + v[0]; r = st.r + v[1]; }
      if (!has(st.c, st.r, st.d)) return fail('no-street', i);
      if (s.t === 'x') {
        /* v1.0.2: «an der Ampel geradeaus» vale también en un cruce en T (la calle sigue derecho y sale una calle a un lado) */
        if (s.amp) {
          if (!isAmpel(c, r)) return fail('no-ampel', i);
          if (!has(c, r, st.d) || !(has(c, r, leftOf(st.d)) || has(c, r, rightOf(st.d)))) return fail('not-crossing', i);
        } else if (!isCross(c, r, st.d)) return fail('not-crossing', i);
        acts[i] = { c: c, r: r };
        st = { c: c, r: r, d: st.d, mid: false }; nd = node(c, r); marks.push(nd);
        continue;
      }
      if (s.t === 'k') {
        if (!isCross(c, r, st.d)) return fail('not-crossing', i);
        acts[i] = { c: c, r: r };
        nd = node(c, r); pts.push(nd); marks.push(nd);
        st = { c: c, r: r, d: sideDir(st.d, s.s), mid: false };
        continue;
      }
      if (s.t === 't') {
        var count = 0, ok = false;
        while (guard++ < 10 && inGrid(c, r)) {
          /* nur echte Abzweigungen zählen (die Straße geht auch geradeaus weiter) */
          if (has(c, r, sideDir(st.d, s.s)) && has(c, r, st.d)) { count++; if (count === s.k) { ok = true; break; } }
          if (!has(c, r, st.d)) break;
          c += v[0]; r += v[1];
        }
        if (!ok) return fail('no-such-street', i);
        acts[i] = { c: c, r: r };
        nd = node(c, r); pts.push(nd); marks.push(nd);
        st = { c: c, r: r, d: sideDir(st.d, s.s), mid: false };
        continue;
      }
      if (s.t === 'a' || s.t === 'e') {
        var hit = false;
        while (guard++ < 10 && inGrid(c, r)) {
          if (s.t === 'a' && isAmpel(c, r)) { hit = true; break; }
          if (s.t === 'e' && !has(c, r, st.d)) { hit = true; break; }
          if (!has(c, r, st.d)) break;
          c += v[0]; r += v[1];
        }
        if (!hit) return fail(s.t === 'a' ? 'no-ampel' : 'no-end', i);
        if (!has(c, r, sideDir(st.d, s.s))) return fail('cannot-turn', i);
        acts[i] = { c: c, r: r };
        nd = node(c, r); pts.push(nd); marks.push(nd);
        st = { c: c, r: r, d: sideDir(st.d, s.s), mid: false };
        continue;
      }
      return fail('unknown-step', i);
    }
    if (!dest) return fail('no-dest', route.steps.length);
    return { ok: true, dest: dest, pts: pts, marks: marks, start: start, h: route.h, acts: acts };
  }

  /* Texte */
  var ORD = { 1: 'erste', 2: 'zweite', 3: 'dritte' };
  var ORD_ES = { 1: 'primera', 2: 'segunda', 3: 'tercera' };
  function sideDe(s) { return s === 'L' ? 'links' : 'rechts'; }
  function sideEs(s) { return s === 'L' ? 'a la izquierda' : 'a la derecha'; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  /* form: 'du' | 'Sie' | 'es' */
  function stepText(s, form) {
    var sie = form === 'Sie', es = form === 'es';
    var geh = sie ? 'Gehen Sie' : 'Geh', nimm = sie ? 'Nehmen Sie' : 'Nimm';
    var p;
    switch (s.t) {
      case 'g': return es ? 'Sigue derecho.' : geh + ' geradeaus.';
      case 't': return es ? 'Toma la ' + ORD_ES[s.k] + ' calle ' + sideEs(s.s) + '.' : nimm + ' die ' + ORD[s.k] + ' Straße ' + sideDe(s.s) + '.';
      case 'k': return es ? 'En el cruce, ve ' + sideEs(s.s) + '.' : geh + ' an der Kreuzung ' + sideDe(s.s) + '.';
      case 'a': return es ? 'En el semáforo, ve ' + sideEs(s.s) + '.' : geh + ' an der Ampel ' + sideDe(s.s) + '.';
      case 'x': if (s.amp) return es ? 'En el semáforo, sigue derecho (pasa el cruce).' : geh + ' an der Ampel geradeaus.';
        return es ? 'Pasa el cruce (sigue derecho).' : geh + ' über die Kreuzung.';
      case 'e': return es ? 'Al final de la calle, ve ' + (s.w ? 'otra vez ' : '') + sideEs(s.s) + '.' : geh + ' am Ende der Straße ' + (s.w ? 'wieder ' : '') + sideDe(s.s) + '.';
      case 'b': p = D.place(s.p); return es ? 'Sigue derecho hasta ' + p.es + '.' : geh + ' geradeaus bis ' + D.zu(p) + ' ' + p.n + '.';
      case 'z': return null; /* braucht das Ziel */
    }
    return '';
  }
  function destText(route, s, form) {
    var p = D.place(route.dest);
    if (form === 'es') return 'Entonces ' + p.es + ' está ' + sideEs(s.s) + '.';
    return 'Dann ist ' + p.g + ' ' + p.n + ' ' + sideDe(s.s) + '.';
  }
  /* Für «Seguir indicaciones»: das Ziel wird NICHT genannt (sonst verrät der Text die Antwort) */
  function destHiddenText(s, form) {
    if (form === 'es') return 'Entonces el lugar está ' + sideEs(s.s) + '.';
    return 'Dann ist es ' + sideDe(s.s) + '.';
  }
  function routeSteps(route, form, hide) {
    return route.steps.map(function (s) { return s.t === 'z' ? (hide ? destHiddenText(s, form) : destText(route, s, form)) : stepText(s, form); });
  }
  function routeText(route, form) { return routeSteps(route, form).join(' '); }
  function followText(route, form) { return routeSteps(route, form, true).join(' '); }
  function startText(route, form) {
    var p = D.place(route.start);
    if (form === 'es') return 'Estás delante ' + (/^el /.test(p.es) ? 'del ' + p.es.slice(3) : 'de ' + p.es) + '.';
    return (form === 'Sie' ? 'Sie sind vor ' : 'Du bist vor ') + D.dat(p) + ' ' + p.n + '.';
  }
  function askText(p) { return 'Entschuldigung, wie komme ich ' + D.zu(p) + ' ' + p.n + '?'; }

  /* SVG */
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function pillW(p) { return Math.min(188, Math.round(p.n.length * 12.6 + 54)); }
  function svg(opt) {
    opt = opt || {};
    var o = [];
    o.push('<svg class="map" viewBox="0 0 ' + W + ' ' + H + '" role="img" lang="de" aria-label="Stadtplan">');
    o.push('<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e0561b"/></marker></defs>');
    o.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="26" fill="#cdeec4"/>');
    /* Blöcke */
    for (var i = 0; i < X.length - 1; i++) for (var j = 0; j < Y.length - 1; j++) {
      o.push('<rect x="' + (X[i] + 22) + '" y="' + (Y[j] + 22) + '" width="' + (X[i + 1] - X[i] - 44) + '" height="' + (Y[j + 1] - Y[j] - 44) + '" rx="16" fill="#f6efe2"/>');
    }
    /* Straßen */
    var road = 'stroke="#7d8597" stroke-width="38" stroke-linecap="round"';
    var dash = 'stroke="#fff" stroke-width="3" stroke-dasharray="14 12"';
    for (var r = 0; r < Y.length; r++) {
      o.push('<line x1="' + X[0] + '" y1="' + Y[r] + '" x2="' + X[X.length - 1] + '" y2="' + Y[r] + '" ' + road + '/>');
    }
    for (var c = 0; c < X.length; c++) {
      o.push('<line x1="' + X[c] + '" y1="' + Y[0] + '" x2="' + X[c] + '" y2="' + Y[Y.length - 1] + '" ' + road + '/>');
    }
    for (r = 0; r < Y.length; r++) o.push('<line x1="' + X[0] + '" y1="' + Y[r] + '" x2="' + X[X.length - 1] + '" y2="' + Y[r] + '" ' + dash + '/>');
    for (c = 0; c < X.length; c++) o.push('<line x1="' + X[c] + '" y1="' + Y[0] + '" x2="' + X[c] + '" y2="' + Y[Y.length - 1] + '" ' + dash + '/>');
    /* Ampeln */
    D.AMPELN.forEach(function (a) {
      var n = node(a[0], a[1]);
      var ax = n.x - 47;
      o.push('<g class="ampel" aria-label="Ampel"><rect x="' + ax + '" y="' + (n.y - 70) + '" width="24" height="50" rx="6" fill="#222"/>' +
        '<circle cx="' + (ax + 12) + '" cy="' + (n.y - 59) + '" r="6.5" fill="#ff4d4d"/><circle cx="' + (ax + 12) + '" cy="' + (n.y - 45) + '" r="6.5" fill="#ffd23f"/><circle cx="' + (ax + 12) + '" cy="' + (n.y - 31) + '" r="6.5" fill="#3ddc6b"/></g>');
    });
    /* Weg */
    if (opt.route) {
      var sim = simulate(opt.route);
      var pts = sim.pts || [];
      if (opt.path && pts.length > 1) {
        o.push('<polyline class="path" points="' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '" fill="none" stroke="#f08a24" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="2 20" opacity=".95" marker-end="url(#arr)"/>');
      }
    }
    /* Orte */
    D.PLACES.forEach(function (p) {
      if (!p.map) return;
      var xy = placeXY(p), w = pillW(p), cls = 'place';
      if (opt.mark && opt.mark[p.n]) cls += ' ' + opt.mark[p.n];
      o.push('<g class="' + cls + '" data-p="' + esc(p.n) + '" tabindex="' + (opt.tap ? 0 : -1) + '" role="' + (opt.tap ? 'button' : 'img') + '" aria-label="' + esc(p.g + ' ' + p.n) + '">' +
        '<rect class="pbg" x="' + (xy.x - w / 2) + '" y="' + (xy.y - 23) + '" width="' + w + '" height="46" rx="14"/>' +
        '<text x="' + (xy.x - w / 2 + 9) + '" y="' + (xy.y + 9) + '" font-size="24">' + p.i + '</text>' +
        '<text class="pn" x="' + (xy.x - w / 2 + 42) + '" y="' + (xy.y + 7) + '" font-size="20" font-weight="700">' + esc(p.n) + '</text></g>');
    });
    /* Schrittnummern */
    if (opt.route && opt.numbers) {
      var sm = simulate(opt.route);
      (sm.marks || []).forEach(function (m, k) {
        if (opt.upto != null && k > opt.upto) return;
        var hl = opt.active === k ? ' active' : '';
        o.push('<g class="num' + hl + '"><circle cx="' + m.x + '" cy="' + m.y + '" r="17"/><text x="' + m.x + '" y="' + (m.y + 7) + '" text-anchor="middle" font-size="20" font-weight="800">' + (k + 1) + '</text></g>');
      });
    }
    /* Du bist hier */
    if (opt.route) {
      var sp = D.place(opt.route.start), st = segMid({ o: 'H', r: sp.map.r, s: sp.map.s });
      var dx = opt.route.h === 'E' ? 1 : -1;
      o.push('<g class="you" aria-label="Du bist hier"><polygon points="' + (st.x + dx * 44) + ',' + st.y + ' ' + (st.x + dx * 24) + ',' + (st.y - 14) + ' ' + (st.x + dx * 24) + ',' + (st.y + 14) + '" fill="#c7362b"/>' +
        '<circle cx="' + st.x + '" cy="' + st.y + '" r="20" fill="#c7362b" stroke="#fff" stroke-width="4"/><text x="' + st.x + '" y="' + (st.y + 8) + '" text-anchor="middle" font-size="22">⭐</text></g>');
    }
    o.push('</svg>');
    return o.join('');
  }

  g.STADT_MAP = {
    X: X, Y: Y, W: W, H: H, simulate: simulate, stepText: stepText, routeSteps: routeSteps, routeText: routeText,
    startText: startText, askText: askText, destText: destText, destHiddenText: destHiddenText, followText: followText, svg: svg, placeXY: placeXY, pillW: pillW, opposite: opposite,
    relSide: relSide, isCross: isCross, isAmpel: isAmpel, leftOf: leftOf, rightOf: rightOf, cap: cap
  };
})(typeof window !== 'undefined' ? window : globalThis);
