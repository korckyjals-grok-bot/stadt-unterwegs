/* Übungsbank: erzeugt alle Aufgaben deterministisch aus den Daten. v1.0.0
   kind: mc (opción múltiple) · tap (tocar en el mapa) · order (fichas) · build (elegir indicación para la ruta del mapa)
   fast: true → apto para Desafío 60 s (solo opción múltiple rápida, sin mapa) */
(function (g) {
  'use strict';
  var D = g.STADT_DATA, M = g.STADT_MAP;
  var items = [];
  function add(it) { items.push(it); return it; }
  function PL(n) { return D.place(n); }
  function art(p) { return p.g + ' ' + p.n; }
  /* Spanisch: de + el = del, a + el = al */
  function deEs(x) { return /^el /.test(x) ? 'del ' + x.slice(3) : 'de ' + x; }
  function aEs(x) { return /^el /.test(x) ? 'al ' + x.slice(3) : 'a ' + x; }
  var CONFUSE = [['Hotel', 'Krankenhaus'], ['Café', 'Restaurant'], ['Park', 'Spielplatz'], ['Bahnhof', 'Bushaltestelle'], ['Markt', 'Supermarkt']];
  function confusable(a, b) { return CONFUSE.some(function (c) { return (c[0] === a && c[1] === b) || (c[1] === a && c[0] === b); }); }
  function others(p, n, pred) {
    var list = D.PLACES.filter(function (q) { return q.n !== p.n && !confusable(p.n, q.n) && (!pred || pred(q)); });
    /* deterministisch, aber gemischt */
    var idx = D.PLACES.indexOf(p), out = [];
    for (var k = 0; out.length < n && k < list.length; k++) out.push(list[(idx * 7 + k * 5) % list.length]);
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  /* ---------- ORTE ---------- */
  D.PLACES.forEach(function (p) {
    add({ id: 'art-' + p.n, topic: 'orte', kind: 'mc', fast: true, pic: p.i,
      q: '¿Qué artículo va con este lugar?', de: '___ ' + p.n, o: ['der', 'die', 'das'], a: p.g,
      e: 'Se dice <b>' + art(p) + '</b>. Aprende siempre el lugar con su artículo.', help: p.n + ' = ' + p.es + '.' });
    var wrong3 = p.g === 'die' ? 'zu das' : 'zu die';
    add({ id: 'zu-' + p.n, topic: 'orte', kind: 'mc', fast: true, pic: p.i,
      q: 'Completa con zum o zur:', de: 'Ich gehe ___ ' + p.n + '.', o: ['zum', 'zur', wrong3], a: D.zu(p),
      e: '<b>' + art(p) + '</b> → ' + (p.g === 'die' ? 'zu + der = <b>zur</b>' : 'zu + dem = <b>zum</b>') + ': Ich gehe <b>' + D.zu(p) + ' ' + p.n + '</b>.',
      help: 'Ich gehe ' + D.zu(p) + ' ' + p.n + '. = Voy ' + aEs(p.es) + '.' });
  });
  ['Bahnhof', 'Krankenhaus', 'Schule', 'Bank', 'Kino', 'Park', 'Supermarkt', 'Bibliothek', 'Schwimmbad', 'Eisdiele', 'Bäckerei', 'Post', 'Polizei', 'Kirche', 'Hotel', 'Zoo', 'Café', 'Bushaltestelle', 'Restaurant', 'Apotheke'].forEach(function (n) {
    var p = PL(n), o = [art(p)].concat(others(p, 2).map(art));
    add({ id: 'pic-' + n, topic: 'orte', kind: 'mc', fast: true, pic: p.i, q: '¿Qué lugar es?', de: '', o: o, a: art(p),
      e: p.i + ' = <b>' + art(p) + '</b>.', help: art(p) + ' = ' + p.es + '.' });
  });
  D.PLACES.forEach(function (p) {
    if (!p.map) return;
    add({ id: 'wo-' + p.n, topic: 'orte', kind: 'tap', map: true, q: 'Toca el lugar en el mapa:', de: 'Wo ist ' + art(p) + '?', a: p.n,
      e: p.i + ' <b>' + art(p) + '</b> está marcado en verde.', help: '¿Dónde está ' + p.es + '?' });
  });

  /* ---------- DATIV ---------- */
  var WO = [
    ['Ich bin ___ Kino.', 'im', ['ins', 'in die'], 'wo', 'Estoy en el cine.'],
    ['Lina ist ___ Schule.', 'in der', ['in die', 'im'], 'wo', 'Lina está en la escuela.'],
    ['Wir sind ___ Park.', 'im', ['in den', 'in die'], 'wo', 'Estamos en el parque.'],
    ['Papa ist ___ Supermarkt.', 'im', ['in den', 'in der'], 'wo', 'Papá está en el supermercado.'],
    ['Die Kinder spielen ___ Spielplatz.', 'auf dem', ['auf den', 'auf die'], 'wo', 'Los niños juegan en el parque de juegos.'],
    ['Oma kauft Obst ___ Markt.', 'auf dem', ['auf den', 'auf das'], 'wo', 'La abuela compra fruta en el mercado.'],
    ['Ich warte ___ Bushaltestelle.', 'an der', ['an die', 'an dem'], 'wo', 'Espero en la parada de bus.'],
    ['Tom liest ___ Bibliothek.', 'in der', ['in die', 'im'], 'wo', 'Tom lee en la biblioteca.'],
    ['Wir schwimmen ___ Schwimmbad.', 'im', ['ins', 'in der'], 'wo', 'Nadamos en la piscina.'],
    ['Der Arzt arbeitet ___ Krankenhaus.', 'im', ['ins', 'in die'], 'wo', 'El médico trabaja en el hospital.'],
    ['Ich gehe ___ Kino.', 'ins', ['im', 'in die'], 'wohin', 'Voy al cine.'],
    ['Wir gehen ___ Park.', 'in den', ['im', 'in die'], 'wohin', 'Vamos al parque.'],
    ['Lina geht ___ Bibliothek.', 'in die', ['in der', 'ins'], 'wohin', 'Lina va a la biblioteca.'],
    ['Die Kinder gehen ___ Spielplatz.', 'auf den', ['auf dem', 'auf die'], 'wohin', 'Los niños van al parque de juegos.'],
    ['Mama geht ___ Supermarkt.', 'in den', ['im', 'in die'], 'wohin', 'Mamá va al supermercado.'],
    ['Wir fahren ___ Zoo.', 'in den', ['im', 'in die'], 'wohin', 'Vamos al zoológico.'],
    ['Ich gehe ___ Schwimmbad.', 'ins', ['im', 'in den'], 'wohin', 'Voy a la piscina.'],
    ['Oma geht ___ Markt.', 'auf den', ['auf dem', 'auf die'], 'wohin', 'La abuela va al mercado.']
  ];
  WO.forEach(function (w, i) {
    var isWo = w[3] === 'wo';
    add({ id: 'wowohin-' + i, topic: 'dativ', kind: 'mc', fast: true, q: isWo ? '📍 Wo? (está quieto) Completa:' : '➡️ Wohin? (va hacia allá) Completa:', de: w[0], o: [w[1]].concat(w[2]), a: w[1],
      e: (isWo ? '📍 <b>Wo?</b> → Dativ: ' : '➡️ <b>Wohin?</b> → Akkusativ: ') + w[0].replace('___', '<b>' + w[1] + '</b>'), help: w[4] });
  });
  [['Ich bin im Museum.', 'wo', 'Estoy en el museo.'], ['Ich gehe ins Museum.', 'wohin', 'Voy al museo.'], ['Wir sind in der Kirche.', 'wo', 'Estamos en la iglesia.'],
   ['Wir gehen in die Kirche.', 'wohin', 'Vamos a la iglesia.'], ['Der Hund läuft in den Park.', 'wohin', 'El perro corre hacia el parque.'], ['Der Hund ist im Park.', 'wo', 'El perro está en el parque.']].forEach(function (w, i) {
    var a = w[1] === 'wo' ? '📍 Wo? → Dativ' : '➡️ Wohin? → Akkusativ';
    add({ id: 'woid-' + i, topic: 'dativ', kind: 'mc', fast: true, q: '¿Esta oración responde a Wo? o a Wohin?', de: w[0], o: ['📍 Wo? → Dativ', '➡️ Wohin? → Akkusativ'], a: a,
      e: w[1] === 'wo' ? 'Nadie se mueve hacia un lugar: <b>Wo?</b> → Dativ (im = in dem, in der).' : 'Hay movimiento hacia un lugar: <b>Wohin?</b> → Akkusativ (ins = in das, in den, in die).', help: w[2] });
  });
  var PREP = [
    ['Das Kino ist neben ___ Post.', 'der', ['die', 'dem'], 'die Post → neben <b>der</b> Post', 'El cine está al lado del correo.'],
    ['Die Bank ist neben ___ Bahnhof.', 'dem', ['den', 'der'], 'der Bahnhof → neben <b>dem</b> Bahnhof', 'El banco está al lado de la estación.'],
    ['Hinter ___ Schule ist ein Spielplatz.', 'der', ['die', 'dem'], 'die Schule → hinter <b>der</b> Schule', 'Detrás de la escuela hay un parque de juegos.'],
    ['Lina wartet vor ___ Kino.', 'dem', ['das', 'der'], 'das Kino → vor <b>dem</b> Kino', 'Lina espera delante del cine.'],
    ['Das Auto steht vor ___ Supermarkt.', 'dem', ['den', 'die'], 'der Supermarkt → vor <b>dem</b> Supermarkt', 'El carro está delante del supermercado.'],
    ['Der Park ist hinter ___ Rathaus.', 'dem', ['das', 'der'], 'das Rathaus → hinter <b>dem</b> Rathaus', 'El parque está detrás de la alcaldía.'],
    ['Die Apotheke ist neben ___ Bäckerei.', 'der', ['die', 'den'], 'die Bäckerei → neben <b>der</b> Bäckerei', 'La farmacia está al lado de la panadería.'],
    ['Das Hotel ist neben ___ Museum.', 'dem', ['das', 'den'], 'das Museum → neben <b>dem</b> Museum', 'El hotel está al lado del museo.'],
    ['Geh an ___ Ampel links.', 'der', ['die', 'dem'], 'die Ampel → an <b>der</b> Ampel', 'En el semáforo, ve a la izquierda.'],
    ['Wir warten an ___ Bushaltestelle.', 'der', ['die', 'dem'], 'die Bushaltestelle → an <b>der</b> Bushaltestelle', 'Esperamos en la parada de bus.']
  ];
  PREP.forEach(function (w, i) {
    add({ id: 'prep-' + i, topic: 'dativ', kind: 'mc', fast: true, q: 'Wo? → Dativ. ¿Qué artículo va?', de: w[0], o: [w[1]].concat(w[2]), a: w[1],
      e: 'Para decir dónde está algo usamos <b>Dativ</b>: ' + w[3] + '.', help: w[4] });
  });
  add({ id: 'prep-zw', topic: 'dativ', kind: 'mc', fast: true, q: 'Wo? → Dativ. ¿Qué es correcto?', de: 'Das Café ist zwischen ___ .',
    o: ['der Bank und dem Hotel', 'die Bank und das Hotel', 'dem Bank und der Hotel'], a: 'der Bank und dem Hotel',
    e: 'zwischen + Dativ: die Bank → <b>der</b> Bank, das Hotel → <b>dem</b> Hotel.', help: 'El café está entre el banco y el hotel.' });
  [['zum', 'zu + dem', ['zu + der', 'zu + das']], ['zur', 'zu + der', ['zu + dem', 'zu + die']], ['im', 'in + dem', ['in + das', 'in + den']],
   ['ins', 'in + das', ['in + dem', 'in + die']], ['am', 'an + dem', ['an + das', 'an + der']]].forEach(function (w) {
    add({ id: 'contr-' + w[0], topic: 'dativ', kind: 'mc', fast: true, q: '¿De qué palabras viene?', de: w[0], o: [w[1]].concat(w[2]), a: w[1],
      e: '<b>' + w[0] + '</b> = ' + w[1] + '.', help: 'Es una contracción: preposición + artículo.' });
  });
  add({ id: 'rule-zu', topic: 'dativ', kind: 'mc', fast: true, q: 'Después de «zu» siempre va…', de: 'zu + ?', o: ['Dativ', 'Akkusativ'], a: 'Dativ',
    e: '<b>zu</b> siempre va con Dativ: zum Bahnhof, zur Post.', help: 'zu = a / hacia.' });
  add({ id: 'rule-mit', topic: 'dativ', kind: 'mc', fast: true, q: 'Después de «mit» siempre va…', de: 'mit + ?', o: ['Dativ', 'Akkusativ'], a: 'Dativ',
    e: '<b>mit</b> siempre va con Dativ: mit dem Bus, mit der U-Bahn.', help: 'mit = con / en (un vehículo).' });
  D.PLACES.forEach(function (p) {
    if (!p.map) return;
    var q = M.opposite(p);
    if (!q) return;
    var o = q.g === 'die' ? ['der', 'die', 'dem'] : q.g === 'der' ? ['dem', 'den', 'der'] : ['dem', 'das', 'der'];
    add({ id: 'geg-' + p.n, topic: 'dativ', kind: 'mc', fast: true, q: 'gegenüber + Dativ. Completa:', de: p.g.charAt(0).toUpperCase() + p.g.slice(1) + ' ' + p.n + ' ist gegenüber ___ ' + q.n + '.',
      o: o, a: D.dat(q), e: q.g + ' ' + q.n + ' → gegenüber <b>' + D.dat(q) + '</b> ' + q.n + '.', help: p.es.charAt(0).toUpperCase() + p.es.slice(1) + ' está enfrente ' + deEs(q.es) + '.' });
    add({ id: 'gegtap-' + p.n, topic: 'dativ', kind: 'tap', map: true, q: 'Mira el mapa y toca la respuesta:', de: 'Was ist gegenüber ' + D.dat(p) + ' ' + p.n + '?', a: q.n,
      e: 'Gegenüber ' + D.dat(p) + ' ' + p.n + ' ist <b>' + q.g + ' ' + q.n + '</b> (al otro lado de la calle).', help: '¿Qué hay enfrente ' + deEs(p.es) + '?' });
  });

  /* ---------- VERKEHRSMITTEL ---------- */
  D.VEHICLES.forEach(function (v) {
    var a = v.g === 'die' ? 'mit der' : 'mit dem';
    add({ id: 'mit-' + v.n, topic: 'verkehr', kind: 'mc', fast: true, pic: v.i, q: '¿mit dem o mit der?', de: 'Ich fahre ___ ' + v.n + '.', o: ['mit dem', 'mit der', 'mit die'], a: a,
      e: v.g + ' ' + v.n + ' → mit + Dativ = <b>' + a + ' ' + v.n + '</b>.', help: 'Voy en ' + v.es.replace(/^(el|la) /, '') + '.' });
  });
  var PICS = [['🚌', 'Ich fahre mit dem Bus.'], ['🚲', 'Ich fahre mit dem Fahrrad.'], ['🚗', 'Ich fahre mit dem Auto.'], ['🚇', 'Ich fahre mit der U-Bahn.'],
    ['🚋', 'Ich fahre mit der Straßenbahn.'], ['🚆', 'Ich fahre mit dem Zug.'], ['🚕', 'Ich fahre mit dem Taxi.'], ['🛴', 'Ich fahre mit dem Roller.'], ['🚶', 'Ich gehe zu Fuß.']];
  PICS.forEach(function (w, i) {
    var o = [w[1], PICS[(i + 2) % PICS.length][1], PICS[(i + 5) % PICS.length][1]];
    add({ id: 'wie-' + i, topic: 'verkehr', kind: 'mc', fast: true, pic: w[0], q: 'Mira el dibujo. ¿Qué respondes?', de: 'Wie kommst du zur Schule?', o: o, a: w[1],
      e: w[0] + ' → <b>' + w[1] + '</b>', help: '¿Cómo llegas a la escuela?' });
  });
  var VERB = [
    ['Ich ___ mit dem Bus zur Schule.', 'fahre', ['gehe', 'fährt'], 'Bus → fahren; ich → <b>fahre</b>.', 'Voy en bus a la escuela.'],
    ['Wir ___ zu Fuß zum Park.', 'gehen', ['fahren', 'geht'], 'zu Fuß → gehen; wir → <b>gehen</b>.', 'Vamos a pie al parque.'],
    ['Du ___ mit der U-Bahn zum Museum.', 'fährst', ['fahrst', 'gehst'], 'U-Bahn → fahren; du → <b>fährst</b> (¡con ä!).', 'Vas en metro al museo.'],
    ['Mama ___ mit dem Auto zur Bank.', 'fährt', ['fahrt', 'geht'], 'Auto → fahren; sie → <b>fährt</b> (¡con ä!).', 'Mamá va en carro al banco.'],
    ['Ihr ___ mit der Straßenbahn zum Zoo.', 'fahrt', ['fährt', 'geht'], 'Straßenbahn → fahren; ihr → <b>fahrt</b> (sin ä).', 'Ustedes van en tranvía al zoológico.'],
    ['Lina ___ zu Fuß zur Eisdiele.', 'geht', ['fährt', 'gehen'], 'zu Fuß → gehen; sie → <b>geht</b>.', 'Lina va a pie a la heladería.'],
    ['Ich ___ zu Fuß zur Bäckerei.', 'gehe', ['fahre', 'geht'], 'zu Fuß → gehen; ich → <b>gehe</b>.', 'Voy a pie a la panadería.'],
    ['Herr Weber ___ mit dem Taxi zum Bahnhof.', 'fährt', ['geht', 'fahren'], 'Taxi → fahren; er → <b>fährt</b>.', 'El señor Weber va en taxi a la estación.'],
    ['Die Kinder ___ mit dem Fahrrad zum Spielplatz.', 'fahren', ['fährt', 'gehen'], 'Fahrrad → fahren; sie (plural) → <b>fahren</b>.', 'Los niños van en bicicleta al parque de juegos.'],
    ['Du ___ zu Fuß zur Schule.', 'gehst', ['fährst', 'gehen'], 'zu Fuß → gehen; du → <b>gehst</b>.', 'Vas a pie a la escuela.']
  ];
  VERB.forEach(function (w, i) {
    add({ id: 'verb-' + i, topic: 'verkehr', kind: 'mc', fast: true, q: '¿gehen o fahren? Completa:', de: w[0], o: [w[1]].concat(w[2]), a: w[1], e: w[3], help: w[4] });
  });
  add({ id: 'fuss', topic: 'verkehr', kind: 'mc', fast: true, pic: '🚶', q: 'Completa:', de: 'Ich gehe ___ zur Post.', o: ['zu Fuß', 'mit Fuß', 'auf Fuß'], a: 'zu Fuß',
    e: 'A pie se dice <b>zu Fuß</b>.', help: 'Voy a pie al correo.' });
  [['Ich fahre mit dem Bus zum Bahnhof.', 'Ich fahre mit der Bus zum Bahnhof.', 'Ich gehe mit dem Bus zum Bahnhof.', 'der Bus → mit dem Bus; con vehículo → fahren.', 'Voy en bus a la estación.'],
   ['Wir fahren mit der U-Bahn zur Schule.', 'Wir fahren mit dem U-Bahn zur Schule.', 'Wir fahren mit der U-Bahn zum Schule.', 'die U-Bahn → mit der U-Bahn; die Schule → zur Schule.', 'Vamos en metro a la escuela.'],
   ['Ich gehe zu Fuß zum Kino.', 'Ich fahre zu Fuß zum Kino.', 'Ich gehe zu Fuß zur Kino.', 'zu Fuß → gehen; das Kino → zum Kino.', 'Voy a pie al cine.'],
   ['Oma fährt mit der Straßenbahn zum Markt.', 'Oma fährt mit die Straßenbahn zum Markt.', 'Oma fahrt mit der Straßenbahn zum Markt.', 'die Straßenbahn → mit der; sie → fährt (con ä).', 'La abuela va en tranvía al mercado.']].forEach(function (w, i) {
    add({ id: 'satz-' + i, topic: 'verkehr', kind: 'mc', fast: true, q: '¿Qué oración es correcta?', de: '', o: [w[0], w[1], w[2]], a: w[0], e: 'Correcta: <b>' + w[0] + '</b> ' + w[3], help: w[4] });
  });

  /* ---------- WEGBESCHREIBUNG ---------- */
  var WEG = [
    ['⬅️', 'Mira la flecha. Completa:', 'Geh ___!', 'links', ['rechts', 'geradeaus'], '⬅️ = <b>links</b>.', 'Ve a la izquierda.'],
    ['➡️', 'Mira la flecha. Completa:', 'Geh ___!', 'rechts', ['links', 'geradeaus'], '➡️ = <b>rechts</b>.', 'Ve a la derecha.'],
    ['⬆️', 'Mira la flecha. Completa:', 'Geh ___!', 'geradeaus', ['links', 'rechts'], '⬆️ = <b>geradeaus</b>.', 'Sigue derecho.'],
    ['1️⃣', 'Mira el número. Completa:', 'Nimm die ___ Straße links.', 'erste', ['zweite', 'dritte'], '1 → die <b>erste</b> Straße.', 'Toma la primera calle a la izquierda.'],
    ['2️⃣', 'Mira el número. Completa:', 'Nimm die ___ Straße rechts.', 'zweite', ['erste', 'dritte'], '2 → die <b>zweite</b> Straße.', 'Toma la segunda calle a la derecha.'],
    ['3️⃣', 'Mira el número. Completa:', 'Nimm die ___ Straße links.', 'dritte', ['erste', 'zweite'], '3 → die <b>dritte</b> Straße.', 'Toma la tercera calle a la izquierda.'],
    ['🧒', 'Hablas con un amigo (du). Completa:', '___ geradeaus!', 'Geh', ['Gehst', 'Gehen'], 'Con <b>du</b>: <b>Geh</b> geradeaus!', '¡Sigue derecho!'],
    ['🧒', 'Hablas con un amigo (du). Completa:', '___ die erste Straße rechts!', 'Nimm', ['Nehm', 'Nimmst'], 'nehmen → con <b>du</b>: <b>Nimm</b>!', '¡Toma la primera calle a la derecha!'],
    ['🧒', 'Hablas con un amigo (du). Completa:', '___ mit dem Bus zum Bahnhof!', 'Fahr', ['Fährst', 'Fahren'], 'fahren → con <b>du</b>: <b>Fahr</b>!', '¡Ve en bus a la estación!'],
    ['🧑‍💼', 'Hablas con un adulto (Sie). Completa:', '___ Sie die zweite Straße links!', 'Nehmen', ['Nimm', 'Nimmt'], 'Con <b>Sie</b>: <b>Nehmen Sie</b> …', 'Tome la segunda calle a la izquierda.'],
    ['🧑‍💼', 'Hablas con un adulto (Sie). Completa:', '___ Sie geradeaus!', 'Gehen', ['Geh', 'Geht'], 'Con <b>Sie</b>: <b>Gehen Sie</b> geradeaus!', 'Siga derecho.'],
    ['🧑‍💼', 'Hablas con una señora (Sie). ¿Qué frase es correcta?', '', 'Gehen Sie an der Ampel links.', ['Geh Sie an der Ampel links.', 'Gehst Sie an der Ampel links.'], 'Con <b>Sie</b>: Gehen Sie …', 'En el semáforo, vaya a la izquierda.'],
    ['🧒', 'Hablas con tu amigo (du). ¿Qué frase es correcta?', '', 'Geh an der Ampel rechts.', ['Gehen an der Ampel rechts.', 'Gehst an der Ampel rechts.'], 'Con <b>du</b>: Geh …', 'En el semáforo, ve a la derecha.'],
    ['👫', 'Hablas con dos amigos (ihr). Completa:', '___ geradeaus!', 'Geht', ['Gehst', 'Geh'], 'Con <b>ihr</b>: <b>Geht</b> geradeaus!', '¡Sigan derecho!'],
    ['➕', 'Completa:', 'Geh ___ die Kreuzung.', 'über', ['zu', 'mit'], 'Geh <b>über</b> die Kreuzung = pasa el cruce.', 'Pasa el cruce.'],
    ['🚦', 'Completa:', 'Geh geradeaus bis ___ Ampel.', 'zur', ['zum', 'zu die'], 'die Ampel → bis <b>zur</b> Ampel.', 'Sigue derecho hasta el semáforo.'],
    ['🎬', 'Completa:', 'Geh geradeaus bis ___ Kino.', 'zum', ['zur', 'zu das'], 'das Kino → bis <b>zum</b> Kino.', 'Sigue derecho hasta el cine.'],
    ['🔚', 'Completa:', 'Geh am ___ der Straße links.', 'Ende', ['Ampel', 'Kreuzung'], '<b>am Ende</b> der Straße = al final de la calle.', 'Al final de la calle, ve a la izquierda.'],
    ['↪️', 'Completa:', 'Die Apotheke ist gleich um die ___.', 'Ecke', ['Ende', 'Weg'], '<b>um die Ecke</b> = a la vuelta de la esquina.', 'La farmacia está justo a la vuelta de la esquina.'],
    ['🙋', 'Pregunta el camino al hospital:', '', 'Entschuldigung, wie komme ich zum Krankenhaus?', ['Entschuldigung, wie komme ich zur Krankenhaus?', 'Entschuldigung, wie kommst ich zum Krankenhaus?'], 'das Krankenhaus → <b>zum</b> Krankenhaus; ich → <b>komme</b>.', 'Disculpe, ¿cómo llego al hospital?'],
    ['🙋', 'Pregunta dónde está la biblioteca:', '', 'Entschuldigung, wo ist die Bibliothek?', ['Entschuldigung, wo bist die Bibliothek?', 'Entschuldigung, wo ist der Bibliothek?'], '<b>die</b> Bibliothek; <b>wo ist</b> …?', 'Disculpe, ¿dónde está la biblioteca?'],
    ['🙂', 'Alguien te dice «Danke!». ¿Qué respondes?', 'Danke!', 'Bitte!', ['Links!', 'Entschuldigung!'], 'Danke! – <b>Bitte!</b>', '¡Gracias! – ¡De nada!'],
    ['🏁', 'Tu amigo llegó al lugar. ¿Qué le dices?', '', 'Du bist da!', ['Nimm die zweite Straße links.', 'Wie komme ich zur Post?'], '<b>Du bist da!</b> = ¡Llegaste!', '¡Llegaste!'],
    ['😊', '¿Está lejos? Completa la respuesta:', 'Nein, es ist nicht ___.', 'weit', ['Ampel', 'Straße'], 'Es ist nicht <b>weit</b> = no está lejos.', 'No, no está lejos.'],
    ['👉', 'Completa:', 'Der Bahnhof ist dort ___.', 'drüben', ['Straße', 'Ecke'], 'dort <b>drüben</b> = allá.', 'La estación está allá.']
  ];
  WEG.forEach(function (w, i) {
    add({ id: 'weg-' + i, topic: 'weg', kind: 'mc', fast: true, pic: w[0], q: w[1], de: w[2], o: [w[3]].concat(w[4]), a: w[3], e: w[5], help: w[6] });
  });

  /* Karten-Aufgaben aus den Routen */
  function mutations(route) {
    var out = [];
    route.steps.forEach(function (s, i) {
      var alts = [];
      if (s.s && s.t !== 'z') alts.push(Object.assign({}, s, { s: s.s === 'L' ? 'R' : 'L' }));
      if (s.t === 't') alts.push(Object.assign({}, s, { k: s.k === 1 ? 2 : 1 }));
      if (s.t === 'z') alts.push(Object.assign({}, s, { s: s.s === 'L' ? 'R' : 'L' }));
      alts.forEach(function (a) {
        var st = route.steps.slice(); st[i] = a;
        var r2 = Object.assign({}, route, { steps: st });
        var sim = M.simulate(r2);
        /* falsch = unmöglich oder anderes Ziel */
        if (!sim.ok || sim.dest.n !== route.dest) {
          var destStep = st[st.length - 1];
          var txt = st.map(function (x) {
            if (x.t !== 'z') return M.stepText(x, 'du');
            return 'Dann ist ' + (a === x ? D.place(sim.ok ? sim.dest.n : route.dest).g + ' ' + (sim.ok ? sim.dest.n : route.dest) : D.place(route.dest).g + ' ' + route.dest) + ' ' + (x.s === 'L' ? 'links' : 'rechts') + '.';
          }).join(' ');
          out.push({ i: i, text: txt, z: s.t === 'z' });
        }
      });
    });
    return out;
  }
  D.ROUTES.forEach(function (r, ri) {
    var p = PL(r.dest), sp = PL(r.start);
    ['du', 'Sie'].forEach(function (form) {
      add({ id: 'follow-' + form + '-' + r.id, topic: 'weg', kind: 'tap', map: true, route: r.id, showStart: true, form: form,
        q: 'Escucha o lee el camino. Toca el lugar donde llegas:', de: M.startText(r, form) + ' ' + M.routeText(r, form), a: r.dest,
        e: 'Llegas a <b>' + p.g + ' ' + p.n + '</b>. Mira el camino naranja en el mapa.', help: M.startText(r, 'es') + ' ' + M.routeText(r, 'es') });
    });
    var correct = M.routeText(r, 'du');
    var muts = mutations(r).filter(function (m) { return m.text !== correct; });
    var nonZ = muts.filter(function (m) { return !m.z; }), zs = muts.filter(function (m) { return m.z; });
    var pick = [];
    if (nonZ.length) pick.push(nonZ[ri % nonZ.length]);
    if (nonZ.length > 1) pick.push(nonZ[(ri + 1) % nonZ.length]);
    if (pick.length < 2 && zs.length) pick.push(zs[0]);
    pick = pick.filter(function (v, i, a) { return a.indexOf(v) === i; });
    if (pick.length >= 2) {
      add({ id: 'build-' + r.id, topic: 'weg', kind: 'mc', fast: false, map: true, route: r.id, showPath: true, showStart: true,
        q: 'Mira el camino naranja (⭐ = Du bist hier). ¿Qué indicación es correcta?', de: 'Wie komme ich ' + D.zu(p) + ' ' + p.n + '?',
        o: [correct].concat(pick.map(function (m) { return m.text; })), a: correct,
        e: 'Correcta: <b>' + correct + '</b>', help: M.routeText(r, 'es') });
    }
    /* Reihenfolge: nur wenn keine andere Reihenfolge zum selben Ziel führt */
    var core = r.steps.filter(function (s) { return s.t !== 'g'; });
    if (core.length >= 3 && uniqueOrder(r, core)) {
      add({ id: 'order-' + r.id, topic: 'weg', kind: 'order', map: true, route: r.id, showPath: true, showStart: true,
        q: 'Mira el camino naranja. Toca las frases en orden:', de: 'Wie komme ich ' + D.zu(p) + ' ' + p.n + '?',
        ord: core.map(function (s) { return s.t === 'z' ? M.destText(r, s, 'du') : M.stepText(s, 'du'); }),
        e: 'Orden correcto: <b>' + core.map(function (s) { return s.t === 'z' ? M.destText(r, s, 'du') : M.stepText(s, 'du'); }).join(' ') + '</b>', help: M.routeText(r, 'es') });
    }
  });
  function perms(a) { if (a.length <= 1) return [a]; var out = []; a.forEach(function (x, i) { perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (p) { out.push([x].concat(p)); }); }); return out; }
  function uniqueOrder(r, core) {
    var ok = 0;
    perms(core.map(function (s, i) { return i; })).forEach(function (pi) {
      var sim = M.simulate(Object.assign({}, r, { steps: pi.map(function (i) { return core[i]; }) }));
      if (sim.ok && sim.dest.n === r.dest) ok++;
    });
    return ok === 1;
  }
  /* Fragen bauen (Fichas) */
  ['Bahnhof', 'Post', 'Bibliothek', 'Krankenhaus', 'Schwimmbad', 'Eisdiele'].forEach(function (n) {
    var p = PL(n);
    add({ id: 'frage-' + n, topic: 'weg', kind: 'order', q: 'Arma la pregunta para llegar ' + aEs(p.es) + ':', de: '', pic: p.i,
      ord: ['Entschuldigung,', 'wie', 'komme', 'ich', D.zu(p), n + '?'], e: '<b>Entschuldigung, wie komme ich ' + D.zu(p) + ' ' + n + '?</b>', help: 'Disculpe, ¿cómo llego ' + aEs(p.es) + '?' });
  });
  ['Post', 'Park', 'Apotheke', 'Rathaus'].forEach(function (n) {
    var p = PL(n);
    add({ id: 'woist-' + n, topic: 'weg', kind: 'order', q: 'Arma la pregunta: ¿dónde está ' + p.es + '?', de: '', pic: p.i,
      ord: ['Wo', 'ist', p.g, n + '?'], e: '<b>Wo ist ' + p.g + ' ' + n + '?</b>', help: '¿Dónde está ' + p.es + '?' });
  });

  /* ---------- ORAL ---------- */
  var oral = [];
  var ASKERS = [{ who: '👧 Lena', form: 'du' }, { who: '👴 Herr Becker', form: 'Sie' }, { who: '👦 Tim', form: 'du' }, { who: '👩 Frau Klein', form: 'Sie' }];
  D.ROUTES.forEach(function (r, i) {
    var p = PL(r.dest), sp = PL(r.start);
    oral.push({ id: 'o-frag-' + r.id, type: 'fragen', route: r.id, showStart: true,
      prompt: 'Du bist vor ' + D.dat(sp) + ' ' + sp.n + '. Du möchtest ' + D.zu(p) + ' ' + p.n + '. Frag nach dem Weg!',
      model: M.askText(p), keys: [p.n, 'komme'], help: 'Estás delante ' + deEs(sp.es) + '. Quieres ir ' + aEs(p.es) + '. ¡Pregunta el camino!' });
    var a = ASKERS[i % ASKERS.length];
    oral.push({ id: 'o-erkl-' + r.id, type: 'erklaeren', route: r.id, showStart: true, who: a.who, form: a.form,
      prompt: M.askText(p), model: M.routeText(r, a.form), keys: r.steps.filter(function (s) { return s.s; }).map(function (s) { return s.s === 'L' ? 'links' : 'rechts'; }).concat([p.n]),
      help: 'Te preguntan: «Disculpe, ¿cómo llego ' + aEs(p.es) + '?» Explica el camino con ' + (a.form === 'Sie' ? '«Sie» (adulto): Gehen Sie…, Nehmen Sie…' : '«du» (niño): Geh…, Nimm…') + '. Modelo: ' + M.routeText(r, 'es') });
  });
  [['Schule', '🚌', 'Ich fahre mit dem Bus zur Schule.', 'Voy en bus a la escuela.'], ['Park', '🚶', 'Ich gehe zu Fuß zum Park.', 'Voy a pie al parque.'],
   ['Schwimmbad', '🚲', 'Ich fahre mit dem Fahrrad zum Schwimmbad.', 'Voy en bicicleta a la piscina.'], ['Museum', '🚇', 'Ich fahre mit der U-Bahn zum Museum.', 'Voy en metro al museo.'],
   ['Supermarkt', '🚗', 'Ich fahre mit dem Auto zum Supermarkt.', 'Voy en carro al supermercado.'], ['Zoo', '🚋', 'Ich fahre mit der Straßenbahn zum Zoo.', 'Voy en tranvía al zoológico.'],
   ['Bahnhof', '🚕', 'Ich fahre mit dem Taxi zum Bahnhof.', 'Voy en taxi a la estación.'],
   ['Bahnhof', '🚏', 'Zuerst gehe ich zur Bushaltestelle. Dann fahre ich mit dem Bus zum Bahnhof.', 'Primero voy a la parada de bus. Luego voy en bus a la estación.']].forEach(function (w, i) {
    var p = PL(w[0]);
    oral.push({ id: 'o-wie-' + i, type: 'wie', pic: w[1], prompt: 'Wie kommst du ' + D.zu(p) + ' ' + p.n + '?', model: w[2], keys: w[2].replace(/[.]/g, '').split(' ').filter(function (x) { return /Bus|Fuß|Fahrrad|U-Bahn|Auto|Straßenbahn|Taxi|Bushaltestelle|fahre|gehe/.test(x); }),
      help: '¿Cómo llegas ' + aEs(p.es) + '? Mira el dibujo ' + w[1] + '. Modelo: ' + w[3] });
  });
  D.PLACES.forEach(function (p) {
    if (!p.map || p.map.side !== 'N') return;
    var q = M.opposite(p);
    oral.push({ id: 'o-wo-' + p.n, type: 'wo', mark: p.n, answer: q.n, prompt: 'Entschuldigung, wo ist ' + p.g + ' ' + p.n + '?', model: (p.g.charAt(0).toUpperCase() + p.g.slice(1)) + ' ' + p.n + ' ist gegenüber ' + D.dat(q) + ' ' + q.n + '.',
      keys: ['gegenüber', q.n], help: '¿Dónde está ' + p.es + '? Busca en el mapa qué hay enfrente. Modelo: ' + p.es + ' está enfrente ' + deEs(q.es) + '.' });
  });

  g.STADT_BANK = { items: items, oral: oral, deEs: deEs, aEs: aEs, uniqueOrder: uniqueOrder, mutations: mutations };
})(typeof window !== 'undefined' ? window : globalThis);
