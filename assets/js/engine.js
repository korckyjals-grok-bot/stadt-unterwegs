/* Lógica pura (sin DOM): puntaje, check verde, selección sin repetir. v1.0.1 (sin cambios de lógica) */
(function (g) {
  'use strict';
  var CK = 'aleman_check_stadt', BK = 'stadt_best', TOPICS = ['orte', 'dativ', 'verkehr', 'weg'];
  function qualifies(score, done) { return score >= 13 && done === score; }
  function getChecks(st) { try { var v = JSON.parse(st.getItem(CK) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  /* Guarda récord y checks. Devuelve {record, granted, checks} */
  function applyChallenge(st, topics, score, done) {
    var out = { record: false, granted: false, checks: getChecks(st) };
    var best = +(st.getItem(BK) || 0);
    if (score > best) { st.setItem(BK, String(score)); out.record = true; }
    if (qualifies(score, done)) {
      (topics || []).forEach(function (t) { if (TOPICS.indexOf(t) >= 0 && out.checks.indexOf(t) < 0) out.checks.push(t); });
      st.setItem(CK, JSON.stringify(out.checks));
      out.granted = true;
    }
    return out;
  }
  function pool(items, topics, chal) {
    return items.filter(function (it) {
      if (topics.indexOf(it.topic) < 0) return false;
      if (chal) return it.kind === 'mc' && it.fast === true && !it.map;
      return true;
    });
  }
  function rightOf(it) { return it.kind === 'order' ? it.ord.join(' ') : it.a; }
  function isRight(it, given) { return (Array.isArray(given) ? given.join(' ') : given) === rightOf(it); }
  /* Elige tema al azar y luego ítem; evita los últimos N ids */
  function makePicker(list, rng, recentN) {
    rng = rng || Math.random;
    var recent = [], byTopic = {};
    list.forEach(function (it) { (byTopic[it.topic] = byTopic[it.topic] || []).push(it); });
    var topics = Object.keys(byTopic);
    var N = Math.min(recentN == null ? 12 : recentN, Math.max(0, list.length - 1));
    return function () {
      for (var tries = 0; tries < 60; tries++) {
        var t = topics[Math.floor(rng() * topics.length)], arr = byTopic[t];
        var it = arr[Math.floor(rng() * arr.length)];
        if (recent.indexOf(it.id) >= 0) continue;
        recent.push(it.id); if (recent.length > N) recent.shift();
        return it;
      }
      var rest = list.filter(function (x) { return recent.indexOf(x.id) < 0; });
      var pick = rest.length ? rest[0] : list[0];
      recent.push(pick.id); if (recent.length > N) recent.shift();
      return pick;
    };
  }
  function shuffle(a, rng) { rng = rng || Math.random; a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  g.STADT_ENGINE = { CK: CK, BK: BK, TOPICS: TOPICS, qualifies: qualifies, getChecks: getChecks, applyChallenge: applyChallenge, pool: pool, isRight: isRight, rightOf: rightOf, makePicker: makePicker, shuffle: shuffle };
})(typeof window !== 'undefined' ? window : globalThis);
