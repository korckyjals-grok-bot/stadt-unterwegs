/* In der Stadt unterwegs — interfaz. v1.0.1 */
(function () {
  'use strict';
  var D = window.STADT_DATA, M = window.STADT_MAP, B = window.STADT_BANK, E = window.STADT_ENGINE;
  var SP = window.StadtSpeech, LS = window.StadtListen;
  var $ = function (id) { return document.getElementById(id); };
  var TN = { orte: 'Orte · zum/zur', dativ: 'Dativ', verkehr: 'Verkehrsmittel', weg: 'Wegbeschreibung' };
  var ROUTE = {}; D.ROUTES.forEach(function (r) { ROUTE[r.id] = r; });
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function show(id) { ['home', 'study', 'play', 'oral', 'sum'].forEach(function (x) { $(x).classList.toggle('hid', x !== id); }); window.scrollTo(0, 0); }
  function store() { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; } catch (e) { var m = {}; return { getItem: function (k) { return k in m ? m[k] : null; }, setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } }; } }
  var ST = store();
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }
  var NOVOICE = '🔇 Este navegador no tiene voz en alemán. Lee la frase en voz alta tú mismo.';
  function speak(text) {
    var clean = String(text).replace(/<[^>]+>/g, ' ').replace(/_{3,}/g, '…').replace(/[⬅️➡️⬆️]/g, '');
    try {
      /* speech.js espera a que carguen las voces antes de decidir que no hay voz alemana; nunca usa una voz inglesa */
      if (!SP) { toast(NOVOICE); return; }
      SP.speak(clean, {
        onNoVoice: function () { toast(NOVOICE); },
        onError: function (e) { var c = e && (e.error || e.message); if (c === 'interrupted' || c === 'canceled') return; toast('🔇 No se pudo reproducir el audio. Lee la frase en voz alta tú mismo.'); }
      });
    } catch (e) { toast('🔇 No se pudo reproducir el audio.'); }
  }
  /* Asegura que un bloque (mensaje + explicación) se vea completo por encima de la barra fija de abajo */
  function revealAbove(el, bar) {
    try {
      if (!el || el.classList.contains('hid')) return;
      var h = bar && bar.classList.contains('stick') ? bar.offsetHeight : 0;
      var r = el.getBoundingClientRect(), limit = window.innerHeight - h - 12;
      if (r.bottom > limit) {
        var dy = r.bottom - limit, top = $('msg').getBoundingClientRect().top;
        /* no subir tanto que el mensaje ¡Muy bien!/¡Casi! se salga por arriba */
        if (el.id === 'exp' && top - dy < 8) dy = Math.max(0, top - 8);
        window.scrollBy(0, dy);
      }
    } catch (e) {}
  }
  function stopSpeak() { try { SP && SP.cancel(); } catch (e) {} }
  function drawCk() { var c = E.getChecks(ST); document.querySelectorAll('.chk').forEach(function (e) { e.classList.toggle('no', c.indexOf(e.dataset.t) < 0); }); }
  function home() { stopTimer(); stopSpeak(); chal = false; drawCk(); $('best').textContent = ST.getItem(E.BK) || 0; document.querySelectorAll('.nm').forEach(function (e) { e.textContent = window.NM(); }); show('home'); }
  document.querySelectorAll('[data-home]').forEach(function (b) { b.onclick = home; });

  /* ---------------- MAPA ---------------- */
  function drawMap(box, opt, onTap) {
    box.innerHTML = M.svg(opt);
    box.classList.toggle('tapmap', !!onTap);
    box.classList.remove('hid');
    fitLabels(box);
    if (onTap) {
      box.onclick = function (ev) { var g = ev.target.closest && ev.target.closest('.place'); if (g) onTap(g.dataset.p, g); };
      box.onkeydown = function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest && ev.target.closest('.place')) { ev.preventDefault(); var g = ev.target.closest('.place'); onTap(g.dataset.p, g); } };
    } else { box.onclick = null; box.onkeydown = null; }
  }

  /* Si la fuente del dispositivo es más ancha, comprime el texto para que quepa en su etiqueta */
  function fitLabels(box) {
    try {
      [].forEach.call(box.querySelectorAll('g.place'), function (g) {
        var t = g.querySelector('.pn'), r = g.querySelector('.pbg');
        var avail = r.getBBox().x + r.getBBox().width - t.getBBox().x - 6;
        if (t.getBBox().width > avail && avail > 20) { t.setAttribute('textLength', String(Math.floor(avail))); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      });
    } catch (e) {}
  }

  /* ---------------- ESTUDIAR ---------------- */
  var CARDSETS = {
    orte: D.PLACES.map(function (p) { return { f: '<span class="big">' + p.i + ' ' + p.g + ' ' + p.n + '</span>', b: '<span class="big">' + D.zu(p) + ' ' + p.n + '</span><br>Ich gehe ' + D.zu(p) + ' ' + p.n + '.', es: p.n + ' = ' + p.es + '. ' + (p.g === 'die' ? 'die → zur' : p.g + ' → zum'), say: p.g + ' ' + p.n + '. Ich gehe ' + D.zu(p) + ' ' + p.n + '.' }; }),
    dativ: D.CARDS.dativ, verkehr: D.CARDS.verkehr, weg: D.CARDS.weg
  };
  var STABS = [['rutas', '🗺️ Rutas'], ['weg', '🧭 Frases'], ['orte', '🏙️ Orte'], ['dativ', '📍 Dativ'], ['verkehr', '🚌 Verkehr']];
  var stTab = 'rutas', fcI = 0, fcF = false, fcH = false, rI = 0, rForm = 'du', rHelp = false, rActive = -1;
  function showStudy() {
    $('stTabs').innerHTML = STABS.map(function (t) { return '<button class="btn ' + (t[0] === stTab ? 'g' : 'gray') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    $('stTabs').querySelectorAll('button').forEach(function (b) { b.onclick = function () { stTab = b.dataset.tab; fcI = 0; fcF = false; fcH = false; stopSpeak(); showStudy(); }; });
    $('stRoute').classList.toggle('hid', stTab !== 'rutas');
    $('stCards').classList.toggle('hid', stTab === 'rutas');
    if (stTab === 'rutas') drawRoute(); else drawFc();
    show('study');
  }
  function von(p) { return p.g === 'die' ? 'von der' : 'vom'; }
  function drawRoute() {
    var r = D.ROUTES[rI], sp = D.place(r.start), p = D.place(r.dest);
    $('stTitle').textContent = '🗺️ Rutas modelo (' + (rI + 1) + '/' + D.ROUTES.length + ')';
    $('rTitle').innerHTML = '<span class="de" lang="de">' + M.cap(von(sp)) + ' ' + sp.n + ' ' + D.zu(p) + ' ' + p.n + '</span>';
    $('fDu').className = 'btn ' + (rForm === 'du' ? '' : 'gray'); $('fSie').className = 'btn ' + (rForm === 'Sie' ? 'p' : 'gray');
    $('rAsk').textContent = '🙋 ' + M.askText(p);
    drawMap($('rMap'), { route: r, path: true, numbers: true, active: rActive, mark: (function () { var m = {}; m[p.n] = 'target'; return m; })() });
    var steps = M.routeSteps(r, rForm), es = M.routeSteps(r, 'es');
    var html = '<li data-i="-1"><span class="n">⭐</span><span class="tx" lang="de">' + M.startText(r, rForm) + (rHelp ? '<span class="es" lang="es">' + M.startText(r, 'es') + '</span>' : '') + '</span><button class="say" aria-label="Escuchar">🔊</button></li>';
    steps.forEach(function (s, i) {
      html += '<li data-i="' + i + '" class="' + (i === rActive ? 'active' : '') + '"><span class="n">' + (i + 1) + '</span><span class="tx" lang="de">' + s + (rHelp ? '<span class="es" lang="es">' + es[i] + '</span>' : '') + '</span><button class="say" aria-label="Escuchar">🔊</button></li>';
    });
    $('rSteps').innerHTML = html;
    $('rSteps').querySelectorAll('li').forEach(function (li) {
      li.onclick = function () {
        var i = +li.dataset.i; rActive = i; drawRoute();
        speak(i < 0 ? M.startText(r, rForm) : steps[i]);
      };
    });
    $('rHelp').textContent = rHelp ? '🙈 Ocultar ayuda' : '🆘 Ayuda';
  }
  $('rPrev').onclick = function () { rI = (rI - 1 + D.ROUTES.length) % D.ROUTES.length; rActive = -1; stopSpeak(); drawRoute(); };
  $('rNext').onclick = function () { rI = (rI + 1) % D.ROUTES.length; rActive = -1; stopSpeak(); drawRoute(); };
  $('fDu').onclick = function () { rForm = 'du'; drawRoute(); };
  $('fSie').onclick = function () { rForm = 'Sie'; drawRoute(); };
  $('rHelp').onclick = function () { rHelp = !rHelp; drawRoute(); };
  $('rAskSay').onclick = function () { speak(M.askText(D.place(D.ROUTES[rI].dest))); };
  $('rSayAll').onclick = function () { var r = D.ROUTES[rI]; speak(M.startText(r, rForm) + ' ' + M.routeText(r, rForm)); };
  function drawFc() {
    var set = CARDSETS[stTab], c = set[fcI];
    var label = STABS.filter(function (t) { return t[0] === stTab; })[0][1];
    $('stTitle').textContent = '📖 ' + label + ' (' + (fcI + 1) + '/' + set.length + ')';
    $('fc').innerHTML = fcF ? '<div lang="de">' + c.b + '</div>' : '<div class="big" lang="de">' + c.f + '</div>';
    $('fcHelp').textContent = '🆘 ' + c.es; $('fcHelp').classList.toggle('hid', !fcH);
    $('fcHelpB').textContent = fcH ? '🙈 Ocultar ayuda' : '🆘 Ayuda';
  }
  $('fc').onclick = function () { fcF = !fcF; drawFc(); };
  $('fcPrev').onclick = function () { var n = CARDSETS[stTab].length; fcI = (fcI - 1 + n) % n; fcF = false; fcH = false; drawFc(); };
  $('fcNext').onclick = function () { var n = CARDSETS[stTab].length; fcI = (fcI + 1) % n; fcF = false; fcH = false; drawFc(); };
  $('fcSay').onclick = function () { speak(CARDSETS[stTab][fcI].say); };
  $('fcHelpB').onclick = function () { fcH = !fcH; drawFc(); };
  $('bStudy').onclick = showStudy;

  /* ---------------- PRACTICAR / DESAFÍO ---------------- */
  var cur = null, score = 0, streak = 0, done = 0, missed = [], answered = false, chal = false, timer = null, left = 0, chalT = [], repeatQ = [], picker = null, curTopics = [];
  function sel() { var s = [].slice.call(document.querySelectorAll('#topics input:checked')).map(function (i) { return i.value; }); return s.length ? s : E.TOPICS.slice(); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function begin(topics, isChal) {
    curTopics = topics; score = 0; streak = 0; done = 0; missed = []; chal = isChal;
    picker = E.makePicker(E.pool(B.items, topics, isChal));
    $('sc').textContent = 0; $('st').textContent = 0; show('play'); stopTimer();
    $('bHelp').classList.toggle('hid', isChal);
    if (chal) {
      left = 60; $('tm').classList.remove('hid'); $('tm').textContent = '⏱️ 60';
      timer = setInterval(function () { left--; $('tm').textContent = '⏱️ ' + left; if (left <= 0) finish(); }, 1000);
    } else $('tm').classList.add('hid');
    next();
  }
  function next() {
    stopSpeak();
    cur = repeatQ.length ? repeatQ.shift() : picker();
    answered = false;
    $('tg').textContent = TN[cur.topic];
    $('qt').textContent = cur.q;
    $('pic').textContent = cur.pic || ''; $('pic').classList.toggle('hid', !cur.pic);
    $('senTx').textContent = cur.de || ''; $('sen').classList.toggle('hid', !cur.de);
    $('cnt').textContent = 'Preguntas: ' + done;
    $('opts').innerHTML = ''; $('msg').textContent = ''; $('exp').classList.add('hid'); $('nx').classList.add('hid'); $('pAct').classList.remove('stick');
    $('pHelp').classList.add('hid'); $('pHelp').textContent = '🆘 ' + (cur.help || '');
    $('bHelp').textContent = '🆘 Ayuda';
    var mapBox = $('pMap');
    if (cur.map) {
      var r = cur.route ? ROUTE[cur.route] : null;
      drawMap(mapBox, { route: r, path: !!cur.showPath, tap: cur.kind === 'tap' }, cur.kind === 'tap' ? function (n, g) { answer(n, g); } : null);
    } else { mapBox.classList.add('hid'); mapBox.innerHTML = ''; }
    if (cur.kind === 'order') return drawOrder();
    if (cur.kind === 'tap') { $('opts').innerHTML = '<p class="hint">👆 Toca un lugar en el mapa.</p>'; return; }
    E.shuffle(cur.o).forEach(function (o) {
      var b = document.createElement('button'); b.className = 'btn opt' + (o.length > 38 ? ' long' : ''); b.textContent = o; b.lang = 'de';
      b.onclick = function () { answer(o, b); }; $('opts').appendChild(b);
    });
  }
  function drawOrder() {
    var built = [], bx = document.createElement('div'); bx.className = 'built'; bx.textContent = '…'; bx.lang = 'de';
    var ch = document.createElement('div'); ch.className = 'chips';
    var sh = E.shuffle(cur.ord.map(function (w, i) { return [w, i]; }));
    var guard = 0; while (sh.length > 1 && sh.every(function (x, i) { return x[1] === i; }) && guard++ < 20) sh = E.shuffle(sh);
    sh.forEach(function (x) {
      var c = document.createElement('button'); c.className = 'chip'; c.textContent = x[0]; c.lang = 'de';
      c.onclick = function () { if (answered) return; c.disabled = true; built.push(x[0]); bx.textContent = built.join(' '); if (built.length === cur.ord.length) answer(built.slice(), null, bx); };
      ch.appendChild(c);
    });
    var rs = document.createElement('button'); rs.className = 'btn gray'; rs.textContent = '↩️ Borrar';
    rs.onclick = function () { if (answered) return; built.length = 0; bx.textContent = '…'; [].forEach.call(ch.children, function (x) { x.disabled = false; }); };
    $('opts').append(bx, ch, rs);
  }
  var GOOD = ['¡Muy bien! 🎉', '¡Excelente! ⭐', '¡Correcto! 👏', '¡Eres un crack! 🚀', '¡Súper! 💪', 'Sehr gut! 🇩🇪'];
  function answer(given, el, bx) {
    if (answered) return; answered = true; done++;
    var ok = E.isRight(cur, given), right = E.rightOf(cur);
    if (cur.kind === 'order') {
      bx.style.background = ok ? '#c9f1d8' : '#ffd6d1';
      if (ok && cur.sentence) bx.textContent = cur.sentence;
      if (!ok) bx.innerHTML = 'Tu respuesta: ' + given.join(' ') + '<br>✔️ ' + (cur.sentence || right);
    } else if (cur.kind === 'tap') {
      var mk = {}; mk[cur.a] = 'ok'; if (!ok) mk[given] = 'bad';
      var r = cur.route ? ROUTE[cur.route] : null;
      drawMap($('pMap'), { route: r, path: !!r, numbers: !!r, mark: mk }, null);
    } else {
      [].forEach.call($('opts').children, function (x) { if (x.textContent === right) x.classList.add('ok'); });
    }
    if (ok) { score++; streak++; $('msg').textContent = rnd(GOOD) + (streak >= 3 ? ' ¡Racha de ' + streak + '! 🔥' : ''); }
    else { if (el && el.classList && cur.kind === 'mc') el.classList.add('bad'); streak = 0; missed.push(cur); $('msg').textContent = '¡Casi! Mira la respuesta correcta 💡'; }
    $('sc').textContent = score; $('st').textContent = streak; $('cnt').textContent = 'Preguntas: ' + done;
    if (chal) { setTimeout(function () { if (chal && left > 0) next(); }, ok ? 600 : 1800); return; }
    $('exp').innerHTML = 'ℹ️ ' + cur.e; $('exp').classList.remove('hid'); $('nx').classList.remove('hid'); $('pAct').classList.add('stick');
    revealAbove($('exp'), $('pAct'));
  }
  var lock = 0;
  $('nx').onclick = function () { if (Date.now() - lock < 400) return; lock = Date.now(); next(); };
  $('bHelp').onclick = function () { var h = $('pHelp'); h.classList.toggle('hid'); $('bHelp').textContent = h.classList.contains('hid') ? '🆘 Ayuda' : '🙈 Ocultar ayuda'; revealAbove(h, $('pAct')); };
  $('senSay').onclick = function () { speak(cur && cur.de); };
  function finish() {
    stopTimer(); stopSpeak(); var wasChal = chal; chal = false; var t = '¡Buen trabajo, ' + window.NM() + '! 🌟';
    if (wasChal) {
      var res = E.applyChallenge(ST, chalT, score, done);
      if (res.record) t = '🏆 ¡Nuevo récord: ' + score + '!';
      if (res.granted) { drawCk(); t = '✅ ¡Tema superado! ' + score + ' sin errores. ¡Bravo, ' + window.NM() + '!'; }
    }
    $('sumT').textContent = t; $('sumP').textContent = 'Respondiste bien ' + score + ' de ' + done + ' preguntas.';
    $('sumL').innerHTML = missed.length ? '<h3>Para repasar:</h3><ul>' + missed.map(function (q) { return '<li><b>' + q.q + '</b> ' + (q.de || '') + '<br>✔️ ' + (q.sentence || E.rightOf(q)) + ' — ' + q.e + '</li>'; }).join('') + '</ul>' : '<p>¡No tuviste errores! 🎉</p>';
    $('rep').classList.toggle('hid', !missed.length); show('sum');
  }
  $('bFinish').onclick = finish;
  $('bPractice').onclick = function () { repeatQ = []; begin(sel(), false); };
  $('bChal').onclick = function () { repeatQ = []; chalT = sel(); begin(chalT, true); };
  $('rep').onclick = function () { repeatQ = missed.slice(); begin(E.TOPICS.slice(), false); };

  /* ---------------- ORAL ---------------- */
  var oList = [], oI = 0, oDone = 0, oPathOn = false, oHelpOn = false, oListen = null;
  function oralMenu() { stopSpeak(); $('oMenu').classList.remove('hid'); $('oCard').classList.add('hid'); show('oral'); }
  document.querySelectorAll('[data-otype]').forEach(function (b) {
    b.onclick = function () {
      var t = b.dataset.otype;
      oList = E.shuffle(B.oral.filter(function (o) { return t === 'mix' || o.type === t; }));
      oI = 0; $('oMenu').classList.add('hid'); $('oCard').classList.remove('hid'); drawOral();
    };
  });
  var OTASK = {
    fragen: '🙋 Pregunta el camino en voz alta. Empieza con «Entschuldigung, …».',
    erklaeren: '🧭 Te hacen esta pregunta. Mira el mapa (⭐ = donde están) y explica el camino en voz alta.',
    wie: '🚌 Responde en voz alta con una oración completa. Mira el dibujo.',
    wo: '📍 Mira el mapa: ¿qué hay al otro lado de la calle? Responde en voz alta con «gegenüber».'
  };
  function drawOral() {
    stopSpeak(); if (oListen) { oListen.stop(); oListen = null; }
    var o = oList[oI]; oPathOn = false; oHelpOn = false;
    $('oCnt').textContent = (oI + 1) + ' / ' + oList.length; $('oDone').textContent = oDone;
    $('oWho').innerHTML = o.who ? o.who + ' pregunta · <span class="form ' + (o.form === 'Sie' ? 'sie' : '') + '">' + (o.form === 'Sie' ? '🧑‍💼 responde con Sie' : '🧒 responde con du') + '</span>' : '';
    $('oWho').classList.toggle('hid', !o.who);
    $('oPrompt').textContent = o.prompt; $('oTask').textContent = OTASK[o.type];
    $('oPic').textContent = o.pic || ''; $('oPic').classList.toggle('hid', !o.pic);
    $('oHeard').classList.add('hid'); $('oModel').classList.add('hid'); $('oHelp').classList.add('hid');
    $('oHelp').textContent = '🆘 ' + o.help; $('oHelpB').textContent = '🆘 Ayuda';
    $('oPath').classList.toggle('hid', o.type !== 'erklaeren'); $('oPath').textContent = '🧭 Ver camino';
    $('oMic').classList.toggle('hid', !(LS && LS.supported));
    oralMap(false, false);
  }
  function oralMap(path, reveal) {
    var o = oList[oI], box = $('oMap');
    if (o.type === 'wie') { box.classList.add('hid'); box.innerHTML = ''; return; }
    var r = o.route ? ROUTE[o.route] : null, mk = {};
    if (r) mk[r.dest] = reveal ? 'ok' : 'target';
    if (o.mark) mk[o.mark] = 'target';
    if (o.answer && reveal) mk[o.answer] = 'ok';
    drawMap(box, { route: r, path: path, numbers: path, mark: mk });
  }
  function showModel() {
    var o = oList[oI];
    var lab = o.form ? '<span class="form ' + (o.form === 'Sie' ? 'sie' : '') + '">' + (o.form === 'Sie' ? 'Sie' : 'du') + '</span> ' : '';
    $('oModel').innerHTML = '💡 Modelo: ' + lab + '<b lang="de">' + o.model + '</b> <button class="say" id="oModelSay" aria-label="Escuchar modelo">🔊</button><br><span class="hint">Escucha y repite en voz alta 2 veces.</span>';
    $('oModel').classList.remove('hid'); revealAbove($('oModel'), $('oCard').querySelector('.actions'));
    $('oModelSay').onclick = function () { speak(o.model); };
    if (o.type === 'erklaeren') { oPathOn = true; $('oPath').textContent = '🙈 Ocultar camino'; }
    oralMap(oPathOn, true);
    speak(o.model);
  }
  $('oShow').onclick = showModel;
  $('oSay').onclick = function () { speak(oList[oI].prompt); };
  $('oPath').onclick = function () { oPathOn = !oPathOn; $('oPath').textContent = oPathOn ? '🙈 Ocultar camino' : '🧭 Ver camino'; oralMap(oPathOn, !$('oModel').classList.contains('hid')); };
  $('oHelpB').onclick = function () { oHelpOn = !oHelpOn; $('oHelp').classList.toggle('hid', !oHelpOn); $('oHelpB').textContent = oHelpOn ? '🙈 Ocultar ayuda' : '🆘 Ayuda'; revealAbove($('oHelp'), $('oCard').querySelector('.actions')); };
  $('oNext').onclick = function () { oDone++; oI = (oI + 1) % oList.length; if (oI === 0) oList = E.shuffle(oList); drawOral(); };
  $('oAgain').onclick = function () { $('oHeard').classList.add('hid'); speak(oList[oI].prompt); };
  $('oBack').onclick = oralMenu;
  $('oMic').onclick = function () {
    var o = oList[oI], h = $('oHeard');
    h.classList.remove('hid'); h.textContent = '🎤 Te escucho… habla ahora en alemán.';
    stopSpeak();
    oListen = LS.listen({
      onResult: function (alts) {
        oListen = null;
        var best = alts[0] || '', hit = [];
        alts.forEach(function (a) { var m = LS.matchKeys(a, o.keys); if (m.length > hit.length) { hit = m; best = a; } });
        var uniq = []; (o.keys || []).forEach(function (k) { if (uniq.indexOf(k) < 0) uniq.push(k); });
        h.innerHTML = '👂 Escuché: «' + best.replace(/</g, '') + '»<br>' + (hit.length ? '⭐ ¡Muy bien! Dijiste: <b>' + hit.join(', ') + '</b>.' + (hit.length < uniq.length ? ' Compara con el modelo 💡.' : ' 🎉') : '🙂 ¡Buen intento! Mira el modelo 💡 y repítelo.');
        revealAbove(h, $('oCard').querySelector('.actions'));
      },
      onError: function () { oListen = null; h.textContent = '🙂 No te escuché bien, ¡no pasa nada! Dilo en voz alta y luego mira el modelo 💡.'; revealAbove(h, $('oCard').querySelector('.actions')); }
    });
  };
  $('bOral').onclick = oralMenu;

  /* ---------------- INICIO ---------------- */
  drawCk(); $('best').textContent = ST.getItem(E.BK) || 0;
  window.__TEST__ = function () {
    return { cur: cur, score: score, done: done, chal: chal, missed: missed, finish: finish, CK: E.CK, BK: E.BK, getCk: function () { return E.getChecks(ST); },
      setScore: function (s, d) { score = s; done = d; $('sc').textContent = s; $('cnt').textContent = 'Preguntas: ' + d; },
      forceChal: function (t) { chal = true; chalT = t || E.TOPICS.slice(); }, oral: function () { return oList[oI]; }, items: B.items,
      force: function (id) { var it = B.items.filter(function (x) { return x.id === id; })[0]; if (it) { repeatQ = [it]; next(); } return !!it; } };
  };
})();
