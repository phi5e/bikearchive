# astalla bici – bike archive

Eine Seite, ein Plakat pro Bildschirm; das Plakat ist 80% der
Bildschirmhöhe hoch, mittig zwischen Menü und unterem Rand. Unten links steht der
Rahmenname (immer einzeilig, skaliert mit der Breite,
max. 160px, Archivo Expanded Black), darüber das Jahr (13.5px). Beim
Scrollen (in beide Richtungen) gleitet jeder Buchstabe einzeln von rechts
in seinen Platz, wie hinter einem unsichtbaren Vorhang hervor (vom letzten
zum ersten). Gleichzeitig läuft eine Welle einmal von rechts nach links
über den Namen und dehnt und staucht einzelne Buchstaben; die Außenkanten
bleiben dabei fest (GSAP, `js/vendor/`). Links mittig öffnet „view list“
die Liste aller Räder, mittig auf dieser Linie (der aktuelle Name steht
auf der Linie, die anderen darüber und darunter). Oben: Logo, „bike
archive“ und „info“, ohne Hintergrund.

Plain HTML/CSS/JS, kein Build. `index.html` einfach öffnen oder hosten.

## Räder pflegen

Alles steht in `js/bikes.js`: Name, Jahr und Pfad zum Plakat. Die
Platzhalter in `posters/` durch die echten Plakate ersetzen (gleicher
Dateiname, oder Pfad in `bikes.js` anpassen). Neue Platzhalter erzeugt
`node scripts/gen_placeholders.mjs`.
