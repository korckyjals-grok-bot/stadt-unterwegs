/* In der Stadt unterwegs — Inhalte (Deutsch) + Hilfe (Spanisch). v1.0.0 */
(function (g) {
  'use strict';
  /* Orte: n = Name, g = Genus, i = Icon, es = Hilfe, map = Platz auf der Karte {r: Straße (Reihe 0-3), s: Abschnitt (0 links, 1 rechts), side: N/S} */
  var PLACES = [
    { n: 'Bahnhof', g: 'der', i: '🚉', es: 'la estación de tren', map: { r: 0, s: 0, side: 'N' } },
    { n: 'Park', g: 'der', i: '🌳', es: 'el parque', map: { r: 0, s: 1, side: 'N' } },
    { n: 'Post', g: 'die', i: '🏤', es: 'el correo', map: { r: 0, s: 0, side: 'S' } },
    { n: 'Kino', g: 'das', i: '🎬', es: 'el cine', map: { r: 0, s: 1, side: 'S' } },
    { n: 'Bäckerei', g: 'die', i: '🥐', es: 'la panadería', map: { r: 1, s: 0, side: 'N' } },
    { n: 'Eisdiele', g: 'die', i: '🍦', es: 'la heladería', map: { r: 1, s: 1, side: 'N' } },
    { n: 'Apotheke', g: 'die', i: '💊', es: 'la farmacia', map: { r: 1, s: 0, side: 'S' } },
    { n: 'Rathaus', g: 'das', i: '🏛️', es: 'la alcaldía', map: { r: 1, s: 1, side: 'S' } },
    { n: 'Bank', g: 'die', i: '🏦', es: 'el banco', map: { r: 2, s: 0, side: 'N' } },
    { n: 'Bibliothek', g: 'die', i: '📚', es: 'la biblioteca', map: { r: 2, s: 1, side: 'N' } },
    { n: 'Supermarkt', g: 'der', i: '🛒', es: 'el supermercado', map: { r: 2, s: 0, side: 'S' } },
    { n: 'Krankenhaus', g: 'das', i: '🏥', es: 'el hospital', map: { r: 2, s: 1, side: 'S' } },
    { n: 'Schule', g: 'die', i: '🏫', es: 'la escuela', map: { r: 3, s: 0, side: 'N' } },
    { n: 'Schwimmbad', g: 'das', i: '🏊', es: 'la piscina', map: { r: 3, s: 1, side: 'N' } },
    { n: 'Spielplatz', g: 'der', i: '🤸', es: 'el parque de juegos', map: { r: 3, s: 0, side: 'S' } },
    { n: 'Bushaltestelle', g: 'die', i: '🚏', es: 'la parada de bus', map: { r: 3, s: 1, side: 'S' } },
    { n: 'Restaurant', g: 'das', i: '🍽️', es: 'el restaurante' },
    { n: 'Markt', g: 'der', i: '🧺', es: 'el mercado' },
    { n: 'Kirche', g: 'die', i: '⛪', es: 'la iglesia' },
    { n: 'Hotel', g: 'das', i: '🏨', es: 'el hotel' },
    { n: 'Museum', g: 'das', i: '🖼️', es: 'el museo' },
    { n: 'Polizei', g: 'die', i: '🚓', es: 'la policía' },
    { n: 'Café', g: 'das', i: '☕', es: 'el café (cafetería)' },
    { n: 'Zoo', g: 'der', i: '🦁', es: 'el zoológico' }
  ];

  /* Verkehrsmittel */
  var VEHICLES = [
    { n: 'Bus', g: 'der', i: '🚌', es: 'el bus' },
    { n: 'Zug', g: 'der', i: '🚆', es: 'el tren' },
    { n: 'Auto', g: 'das', i: '🚗', es: 'el carro' },
    { n: 'Fahrrad', g: 'das', i: '🚲', es: 'la bicicleta' },
    { n: 'Taxi', g: 'das', i: '🚕', es: 'el taxi' },
    { n: 'U-Bahn', g: 'die', i: '🚇', es: 'el metro' },
    { n: 'Straßenbahn', g: 'die', i: '🚋', es: 'el tranvía' },
    { n: 'Roller', g: 'der', i: '🛴', es: 'el patinete (scooter)' }
  ];

  var AMPELN = [[0, 1], [1, 2]]; /* Kreuzungen mit Ampel [Spalte, Reihe] */

  /* Routen: Start vor einem Ort, Richtung (E = nach rechts auf der Karte, W = nach links).
     Schritte: g = geradeaus · t = n-te Straße links/rechts · k = an der Kreuzung · a = an der Ampel
               x = über die Kreuzung · e = am Ende der Straße · b = bis zum/zur Ort · z = Ziel links/rechts */
  var ROUTES = [
    { id: 'r1', start: 'Bahnhof', h: 'E', dest: 'Rathaus', steps: [{ t: 'g' }, { t: 't', k: 1, s: 'R' }, { t: 'k', s: 'L' }, { t: 'z', s: 'R' }] },
    { id: 'r2', start: 'Schule', h: 'E', dest: 'Bibliothek', steps: [{ t: 'g' }, { t: 't', k: 1, s: 'L' }, { t: 't', k: 1, s: 'R' }, { t: 'z', s: 'L' }] },
    { id: 'r3', start: 'Spielplatz', h: 'W', dest: 'Apotheke', steps: [{ t: 'e', s: 'R' }, { t: 't', k: 2, s: 'R' }, { t: 'z', s: 'R' }] },
    { id: 'r4', start: 'Park', h: 'W', dest: 'Supermarkt', steps: [{ t: 'g' }, { t: 't', k: 1, s: 'L' }, { t: 'a', s: 'R' }, { t: 'z', s: 'L' }] },
    { id: 'r5', start: 'Bank', h: 'E', dest: 'Eisdiele', steps: [{ t: 'x' }, { t: 'e', s: 'L' }, { t: 't', k: 1, s: 'L' }, { t: 'z', s: 'R' }] },
    { id: 'r6', start: 'Krankenhaus', h: 'W', dest: 'Schule', steps: [{ t: 'a', s: 'L' }, { t: 'e', s: 'R' }, { t: 'z', s: 'R' }] },
    { id: 'r7', start: 'Post', h: 'W', dest: 'Bank', steps: [{ t: 'e', s: 'L' }, { t: 't', k: 2, s: 'L' }, { t: 'z', s: 'L' }] },
    { id: 'r8', start: 'Eisdiele', h: 'W', dest: 'Kino', steps: [{ t: 'k', s: 'R' }, { t: 'e', s: 'R' }, { t: 'z', s: 'R' }] },
    { id: 'r9', start: 'Schwimmbad', h: 'W', dest: 'Bäckerei', steps: [{ t: 'b', p: 'Schule' }, { t: 'e', s: 'R' }, { t: 'a', s: 'R' }, { t: 'z', s: 'L' }] },
    { id: 'r10', start: 'Bushaltestelle', h: 'E', dest: 'Krankenhaus', steps: [{ t: 'e', s: 'L' }, { t: 't', k: 1, s: 'L' }, { t: 'z', s: 'L' }] },
    { id: 'r11', start: 'Apotheke', h: 'E', dest: 'Park', steps: [{ t: 'x' }, { t: 'e', s: 'L' }, { t: 'e', s: 'L', w: true }, { t: 'z', s: 'R' }] },
    { id: 'r12', start: 'Supermarkt', h: 'E', dest: 'Bahnhof', steps: [{ t: 'a', s: 'L' }, { t: 'e', s: 'L' }, { t: 'z', s: 'R' }] },
    { id: 'r13', start: 'Rathaus', h: 'E', dest: 'Bibliothek', steps: [{ t: 'e', s: 'R' }, { t: 't', k: 1, s: 'R' }, { t: 'z', s: 'R' }] },
    { id: 'r14', start: 'Kino', h: 'W', dest: 'Apotheke', steps: [{ t: 'b', p: 'Post' }, { t: 'e', s: 'L' }, { t: 'a', s: 'L' }, { t: 'z', s: 'R' }] }
  ];

  /* Lernkarten: f = Vorderseite (Deutsch), b = Rückseite, es = Ayuda (Spanisch), say = vorlesen */
  var CARDS = {
    weg: [
      { f: '⬅️ links', b: 'Geh links!', es: 'a la izquierda', say: 'links. Geh links!' },
      { f: '➡️ rechts', b: 'Geh rechts!', es: 'a la derecha', say: 'rechts. Geh rechts!' },
      { f: '⬆️ geradeaus', b: 'Geh geradeaus!', es: 'derecho / recto', say: 'geradeaus. Geh geradeaus!' },
      { f: '1️⃣ die erste Straße', b: 'Nimm die erste Straße links.', es: 'la primera calle · Toma la primera calle a la izquierda.', say: 'Nimm die erste Straße links.' },
      { f: '2️⃣ die zweite Straße', b: 'Nimm die zweite Straße rechts.', es: 'la segunda calle · Toma la segunda calle a la derecha.', say: 'Nimm die zweite Straße rechts.' },
      { f: '➕ die Kreuzung', b: 'Geh über die Kreuzung.<br>Geh an der Kreuzung links.', es: 'el cruce · Pasa el cruce. · En el cruce, ve a la izquierda.', say: 'Geh über die Kreuzung. Geh an der Kreuzung links.' },
      { f: '🚦 die Ampel', b: 'Geh an der Ampel rechts.', es: 'el semáforo · En el semáforo, ve a la derecha.', say: 'Geh an der Ampel rechts.' },
      { f: '🔚 am Ende der Straße', b: 'Geh am Ende der Straße links.', es: 'al final de la calle · Al final de la calle, ve a la izquierda.', say: 'Geh am Ende der Straße links.' },
      { f: '↪️ um die Ecke', b: 'Die Apotheke ist gleich um die Ecke.', es: 'a la vuelta de la esquina · La farmacia está justo a la vuelta.', say: 'Die Apotheke ist gleich um die Ecke.' },
      { f: '🏁 bis zum / bis zur', b: 'Geh geradeaus bis zum Kino.<br>Geh geradeaus bis zur Post.', es: 'hasta · Sigue derecho hasta el cine / hasta el correo.', say: 'Geh geradeaus bis zum Kino. Geh geradeaus bis zur Post.' },
      { f: '➡️ dann', b: 'Dann ist die Bank links.', es: 'luego / entonces · Entonces el banco está a la izquierda.', say: 'Dann ist die Bank links.' },
      { f: '👉 dort drüben', b: 'Der Bahnhof ist dort drüben.', es: 'allá / allí enfrente · La estación está allá.', say: 'Der Bahnhof ist dort drüben.' },
      { f: '😊 Es ist nicht weit.', b: 'Es ist nicht weit. Es ist ganz nah.', es: 'No está lejos. Está muy cerca.', say: 'Es ist nicht weit. Es ist ganz nah.' },
      { f: '🏁 Du bist da!', b: 'Du bist da! · Sie sind da!', es: '¡Llegaste! (du) · ¡Llegó! (Sie)', say: 'Du bist da! Sie sind da!' },
      { f: '🙋 Entschuldigung, wie komme ich …?', b: 'Entschuldigung, wie komme ich zum Bahnhof?<br>Entschuldigung, wie komme ich zur Post?', es: 'Disculpe, ¿cómo llego a la estación? / ¿… al correo?', say: 'Entschuldigung, wie komme ich zum Bahnhof? Entschuldigung, wie komme ich zur Post?' },
      { f: '🙋 Wo ist …?', b: 'Entschuldigung, wo ist die Bibliothek?<br>Wo ist der Park?', es: 'Disculpe, ¿dónde está la biblioteca? / ¿Dónde está el parque?', say: 'Entschuldigung, wo ist die Bibliothek? Wo ist der Park?' },
      { f: '🙂 Danke! – Bitte!', b: 'Danke schön! – Bitte schön!', es: '¡Gracias! – ¡De nada!', say: 'Danke schön! Bitte schön!' },
      { f: '🧒 du: Geh … / Nimm …', b: 'Geh geradeaus.<br>Nimm die erste Straße links.<br>Fahr mit dem Bus.', es: 'Con un niño o amigo (du): Geh, Nimm, Fahr.', say: 'Geh geradeaus. Nimm die erste Straße links. Fahr mit dem Bus.' },
      { f: '🧑‍💼 Sie: Gehen Sie … / Nehmen Sie …', b: 'Gehen Sie geradeaus.<br>Nehmen Sie die erste Straße links.<br>Fahren Sie mit dem Bus.', es: 'Con un adulto, de forma cortés (Sie): Gehen Sie, Nehmen Sie, Fahren Sie.', say: 'Gehen Sie geradeaus. Nehmen Sie die erste Straße links. Fahren Sie mit dem Bus.' },
      { f: '👫 ihr: Geht … / Nehmt …', b: 'Geht geradeaus.<br>Nehmt die zweite Straße rechts.', es: 'Con varios niños (ihr): Geht, Nehmt.', say: 'Geht geradeaus. Nehmt die zweite Straße rechts.' }
    ],
    dativ: [
      { f: 'zu + Dativ', b: '<b>zu</b> siempre va con <b>Dativ</b>.<br>der → <b>dem</b> · das → <b>dem</b> · die → <b>der</b>', es: 'Regla: después de zu, el artículo cambia a dativo.', say: 'zu dem, zu der' },
      { f: 'zum = zu + dem', b: '<b>der</b> Bahnhof → <b>zum</b> Bahnhof<br><b>das</b> Kino → <b>zum</b> Kino', es: 'Para palabras con der o das usamos zum.', say: 'zum Bahnhof, zum Kino' },
      { f: 'zur = zu + der', b: '<b>die</b> Post → <b>zur</b> Post<br><b>die</b> Schule → <b>zur</b> Schule', es: 'Para palabras con die usamos zur.', say: 'zur Post, zur Schule' },
      { f: 'mit + Dativ', b: 'mit <b>dem</b> Bus · mit <b>dem</b> Auto<br>mit <b>der</b> U-Bahn', es: 'Después de mit también va dativo.', say: 'mit dem Bus, mit dem Auto, mit der U-Bahn' },
      { f: 'Wo? 📍 → Dativ', b: 'Ich bin <b>im</b> Park.<br>Ich bin <b>in der</b> Schule.<br>im = in + dem', es: '¿Dónde estoy? (sin moverme) → dativo.', say: 'Ich bin im Park. Ich bin in der Schule.' },
      { f: 'Wohin? ➡️ → Akkusativ', b: 'Ich gehe <b>in den</b> Park.<br>Ich gehe <b>in die</b> Schule.<br>Ich gehe <b>ins</b> Kino. (ins = in + das)', es: '¿A dónde voy? (me muevo hacia allá) → acusativo.', say: 'Ich gehe in den Park. Ich gehe in die Schule. Ich gehe ins Kino.' },
      { f: '📍 Wo? oder ➡️ Wohin?', b: 'Wo? – <b>im</b> Kino (Dativ)<br>Wohin? – <b>ins</b> Kino (Akkusativ)', es: 'Truco: si hay movimiento hacia un lugar → Wohin? (acusativo). Si está quieto → Wo? (dativo).', say: 'Wo? Im Kino. Wohin? Ins Kino.' },
      { f: 'in · an · auf · neben', b: 'Das Kind ist <b>auf dem</b> Spielplatz.<br>Ich warte <b>an der</b> Bushaltestelle.<br>Das Kino ist <b>neben der</b> Post.', es: 'en · junto a/en · sobre/en · al lado de. Para Wo? → dativo.', say: 'Das Kind ist auf dem Spielplatz. Ich warte an der Bushaltestelle. Das Kino ist neben der Post.' },
      { f: 'vor · hinter · zwischen', b: 'Lina wartet <b>vor dem</b> Kino.<br><b>Hinter der</b> Schule ist ein Spielplatz.<br>Das Café ist <b>zwischen der</b> Bank <b>und dem</b> Hotel.', es: 'delante de · detrás de · entre. Para Wo? → dativo.', say: 'Lina wartet vor dem Kino. Hinter der Schule ist ein Spielplatz. Das Café ist zwischen der Bank und dem Hotel.' },
      { f: 'gegenüber + Dativ', b: 'Der Bahnhof ist <b>gegenüber der</b> Post.<br>Der Park ist <b>gegenüber dem</b> Kino.', es: 'enfrente de. Siempre dativo.', say: 'Der Bahnhof ist gegenüber der Post. Der Park ist gegenüber dem Kino.' },
      { f: 'Tabla Dativ', b: 'der → <b>dem</b><br>das → <b>dem</b><br>die → <b>der</b>', es: 'Memoriza esta tabla: es la clave del examen.', say: 'der, dem. das, dem. die, der.' },
      { f: 'Contracciones', b: 'zu + dem = <b>zum</b> · zu + der = <b>zur</b><br>in + dem = <b>im</b> · in + das = <b>ins</b><br>an + dem = <b>am</b>', es: 'Palabras cortas que unen preposición + artículo.', say: 'zum, zur, im, ins, am' }
    ],
    verkehr: [
      { f: '🚶 zu Fuß gehen', b: 'Ich gehe <b>zu Fuß</b> zur Schule.', es: 'ir a pie / caminando', say: 'Ich gehe zu Fuß zur Schule.' },
      { f: '🚌 mit dem Bus', b: 'Ich <b>fahre</b> mit dem Bus zum Bahnhof.', es: 'en bus', say: 'Ich fahre mit dem Bus zum Bahnhof.' },
      { f: '🚗 mit dem Auto', b: 'Mama <b>fährt</b> mit dem Auto zur Bank.', es: 'en carro', say: 'Mama fährt mit dem Auto zur Bank.' },
      { f: '🚲 mit dem Fahrrad', b: 'Tom <b>fährt</b> mit dem Fahrrad zum Park.', es: 'en bicicleta', say: 'Tom fährt mit dem Fahrrad zum Park.' },
      { f: '🚇 mit der U-Bahn', b: 'Wir <b>fahren</b> mit der U-Bahn zum Museum.', es: 'en metro', say: 'Wir fahren mit der U-Bahn zum Museum.' },
      { f: '🚋 mit der Straßenbahn', b: 'Oma <b>fährt</b> mit der Straßenbahn zum Markt.', es: 'en tranvía', say: 'Oma fährt mit der Straßenbahn zum Markt.' },
      { f: '🚆 mit dem Zug · 🚕 mit dem Taxi', b: 'Papa fährt mit dem Zug.<br>Herr Weber fährt mit dem Taxi zum Bahnhof.', es: 'en tren · en taxi', say: 'Papa fährt mit dem Zug. Herr Weber fährt mit dem Taxi zum Bahnhof.' },
      { f: 'gehen 🚶 oder fahren 🚌?', b: '<b>gehen</b> = a pie<br><b>fahren</b> = con un vehículo (Bus, Auto, Fahrrad …)', es: 'Si hay vehículo → fahren. Si caminas → gehen.', say: 'gehen, fahren' },
      { f: 'gehen', b: 'ich gehe · du gehst · er/sie geht<br>wir gehen · ihr geht · sie/Sie gehen', es: 'Conjugación de gehen (ir a pie).', say: 'ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen' },
      { f: 'fahren (ä!)', b: 'ich fahre · du <b>fährst</b> · er/sie <b>fährt</b><br>wir fahren · ihr fahrt · sie/Sie fahren', es: 'Conjugación de fahren. ¡Ojo con la ä en du y er/sie!', say: 'ich fahre, du fährst, er fährt, wir fahren, ihr fahrt, sie fahren' },
      { f: '❓ Wie kommst du zur Schule?', b: 'Ich fahre mit dem Bus zur Schule.<br>Ich gehe zu Fuß zur Schule.', es: '¿Cómo llegas a la escuela? · Voy en bus / a pie.', say: 'Wie kommst du zur Schule? Ich fahre mit dem Bus zur Schule.' },
      { f: '🚏 zuerst … dann …', b: 'Zuerst gehe ich zur Bushaltestelle.<br>Dann fahre ich mit dem Bus zum Bahnhof.', es: 'Primero voy a la parada. Luego voy en bus a la estación.', say: 'Zuerst gehe ich zur Bushaltestelle. Dann fahre ich mit dem Bus zum Bahnhof.' }
    ]
  };

  var D = { PLACES: PLACES, VEHICLES: VEHICLES, ROUTES: ROUTES, CARDS: CARDS, AMPELN: AMPELN, VERSION: '1.0.0' };
  D.place = function (n) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].n === n) return PLACES[i]; return null; };
  D.zu = function (p) { return p.g === 'die' ? 'zur' : 'zum'; };
  D.dat = function (p) { return p.g === 'die' ? 'der' : 'dem'; };
  D.akk = function (p) { return p.g === 'der' ? 'den' : p.g; };
  g.STADT_DATA = D;
})(typeof window !== 'undefined' ? window : globalThis);
