/**
 * Optional German speechSynthesis. User gesture required. Cancel on navigation/next.
 * Adaptado de Wortschatz 1.2.1. Solo voces alemanas; sin voz alemana no habla (sin error).
 */
(function (global) {
  'use strict';

  let voice = null;
  let ready = false;
  let unsupported = false;
  let listeners = [];

  function isGermanVoice(v) {
    if (!v) return false;
    const lang = String(v.lang || '');
    const name = String(v.name || '');
    // Never accept English (or other) voices for German read-aloud
    if (/^en([-_]|$)/i.test(lang)) return false;
    return /^de([-_]|$)/i.test(lang) || /german|deutsch/i.test(name);
  }

  function pickGermanVoice() {
    if (!global.speechSynthesis) {
      unsupported = true;
      voice = null;
      ready = true;
      return null;
    }
    unsupported = false;
    const voices = speechSynthesis.getVoices() || [];
    const de = voices.filter(isGermanVoice);
    // Prefer de-DE local if marked
    de.sort((a, b) => {
      const al = (a.localService ? 0 : 1) - (b.localService ? 0 : 1);
      if (al) return al;
      return (b.lang || '').localeCompare(a.lang || '');
    });
    voice = de[0] || null;
    ready = true;
    listeners.forEach((fn) => {
      try {
        fn(voice);
      } catch (e) {}
    });
    return voice;
  }

  function init() {
    if (!global.speechSynthesis) {
      unsupported = true;
      ready = true;
      return;
    }
    pickGermanVoice();
    if (typeof speechSynthesis.addEventListener === 'function') {
      speechSynthesis.addEventListener('voiceschanged', pickGermanVoice);
    } else {
      speechSynthesis.onvoiceschanged = pickGermanVoice;
    }
    // Delayed re-check for browsers that populate voices late
    setTimeout(pickGermanVoice, 250);
    setTimeout(pickGermanVoice, 1000);
  }

  function onReady(fn) {
    listeners.push(fn);
    if (ready) fn(voice);
  }

  function hasGermanVoice() {
    return !!voice;
  }

  function status() {
    return {
      unsupported: unsupported,
      ready: ready,
      hasGerman: !!voice,
      voiceName: voice ? voice.name : null,
      voiceLang: voice ? voice.lang : null
    };
  }

  function cancel() {
    try {
      if (global.speechSynthesis) speechSynthesis.cancel();
    } catch (e) {}
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!global.speechSynthesis) {
      if (opts.onError) opts.onError(new Error('no speechSynthesis'));
      return false;
    }
    if (!voice) pickGermanVoice();
    if (!voice || !isGermanVoice(voice)) {
      voice = null;
      if (opts.onError) opts.onError(new Error('no German voice'));
      return false;
    }
    cancel();
    try {
      const u = new SpeechSynthesisUtterance(String(text || ''));
      u.voice = voice;
      u.lang = voice.lang || 'de-DE';
      // Force German language tag — never inherit page/en default
      if (!/^de/i.test(u.lang)) u.lang = 'de-DE';
      u.rate = opts.rate || 0.92;
      u.pitch = 1;
      if (opts.onEnd) u.onend = opts.onEnd;
      if (opts.onError) u.onerror = opts.onError;
      speechSynthesis.speak(u);
      return true;
    } catch (e) {
      if (opts.onError) opts.onError(e);
      return false;
    }
  }

  function resetForTests() {
    voice = null;
    ready = false;
    unsupported = false;
    listeners = [];
  }

  init();

  global.StadtSpeech = {
    init: init,
    onReady: onReady,
    hasGermanVoice: hasGermanVoice,
    status: status,
    speak: speak,
    cancel: cancel,
    pickGermanVoice: pickGermanVoice,
    isGermanVoice: isGermanVoice,
    resetForTests: resetForTests
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* Reconocimiento de voz opcional (nunca bloquea ni castiga). */
(function (global) {
  'use strict';
  var Rec = global.SpeechRecognition || global.webkitSpeechRecognition || null;
  function norm(t) { return String(t || '').toLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  /* Welche Schlüsselwörter kommen im Gehörten vor? */
  function matchKeys(heard, keys) {
    var h = ' ' + norm(heard) + ' ';
    var uniq = [];
    (keys || []).forEach(function (k) { if (uniq.indexOf(k) < 0) uniq.push(k); });
    return uniq.filter(function (k) { return h.indexOf(' ' + norm(k) + ' ') >= 0 || h.indexOf(norm(k)) >= 0; });
  }
  function listen(opts) {
    opts = opts || {};
    if (!Rec) { if (opts.onError) opts.onError('unsupported'); return null; }
    var r, done = false, timer;
    function end(fn, v) { if (done) return; done = true; clearTimeout(timer); try { r.abort(); } catch (e) {} if (fn) fn(v); }
    try {
      r = new Rec();
      r.lang = 'de-DE'; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
      r.onresult = function (ev) {
        var alts = [];
        try { for (var i = 0; i < ev.results[0].length; i++) alts.push(ev.results[0][i].transcript); } catch (e) {}
        end(opts.onResult, alts);
      };
      r.onerror = function (ev) { end(opts.onError, (ev && ev.error) || 'error'); };
      r.onend = function () { end(opts.onError, 'no-speech'); };
      r.start();
      timer = setTimeout(function () { end(opts.onError, 'timeout'); }, opts.timeout || 9000);
    } catch (e) { end(opts.onError, 'error'); }
    return { stop: function () { end(null); } };
  }
  global.StadtListen = { supported: !!Rec, listen: listen, matchKeys: matchKeys, norm: norm };
})(typeof window !== 'undefined' ? window : globalThis);
