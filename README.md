# astalla bici – bike archive

Eine Seite, ein Plakat pro Bildschirm (100vh). Unten links steht der
Rahmenname (immer einzeilig, skaliert mit der Breite,
max. 160px, Archivo Expanded Black). Beim Scrollen fliegt der Name
Buchstabe für Buchstabe von unten herein, staucht sich nach links, dehnt
sich gummiartig über die volle Breite und springt dann zurück (GSAP,
`js/vendor/`), darüber das Jahr (18px). Links mittig öffnet „view list“
die Liste aller Räder.

Plain HTML/CSS/JS, kein Build. `index.html` einfach öffnen oder hosten.

## Räder pflegen

Alles steht in `js/bikes.js`: Name, Jahr und Pfad zum Plakat. Die
Platzhalter in `posters/` durch die echten Plakate ersetzen (gleicher
Dateiname, oder Pfad in `bikes.js` anpassen). Neue Platzhalter erzeugt
`node scripts/gen_placeholders.mjs`.
