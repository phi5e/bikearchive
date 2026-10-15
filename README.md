# astalla bici – bike archive

Eine Seite, ein Plakat pro Bildschirm; das Plakat ist 80% der
Bildschirmhöhe hoch, mittig zwischen Menü und unterem Rand. Unten links steht der
Rahmenname (immer einzeilig, skaliert mit der Breite,
max. 160px, Archivo Expanded Black), darüber das Jahr (13.5px). Beim
Scrollen (in beide Richtungen) gleitet jeder Buchstabe einzeln von rechts
in seinen Platz, wie hinter einem unsichtbaren Vorhang hervor (vom letzten
zum ersten). Gleichzeitig läuft eine Welle einmal von rechts nach links
über den Namen und dehnt und staucht einzelne Buchstaben; die Außenkanten
bleiben dabei fest (GSAP, `js/vendor/`). Springt man 2+ Plakate weiter
(schnelles Scrollen, Sprung aus der Liste), animieren die überflogenen
Namen nicht; der Name am Ziel startet kurz nachdem das Scrollen stoppt. Links mittig öffnet „view list“
die Liste aller Räder, mittig auf dieser Linie (der aktuelle Name steht
auf der Linie, die anderen darüber und darunter). Oben: Logo, „bike
archive“ und „info“, ohne Hintergrund.

Variante (zum Ausprobieren): Die Namen kommen in Instrument Serif herein
und verschmelzen dabei zur breiten Sans. Abschalten: in `js/main.js`
`MORPH_FROM_SERIF = false` setzen.

Plain HTML/CSS/JS, kein Build. `index.html` einfach öffnen oder hosten.

## Räder pflegen

Ein neues Rad = ein Bild in `posters/` hochladen, sonst nichts. Name und
Jahr kommen aus dem Dateinamen:

    <Jahr>_<Name_mit_Unterstrichen>.<jpg|png|webp|svg>
    2018_Mash_Steel_Fixed.jpg  →  2018, „Mash Steel Fixed“

Auf GitHub: Ordner `posters` öffnen → „Add file“ → „Upload files“ →
Bild reinziehen → „Commit changes“. Eine GitHub Action
(`.github/workflows/bikes.yml`) baut danach `js/bikes.js` neu; nach etwa
einer Minute ist das Rad in der Seite und in der Liste. Umbenennen oder
Löschen einer Datei wirkt genauso. Echte Plakate stehen vorne, die
`.svg`-Platzhalter dahinter; innerhalb davon nach Jahr (älteste zuerst). Dateien, die nicht dem Muster folgen, werden ignoriert.

Die `.svg`-Dateien in `posters/` sind Platzhalter; einfach löschen, wenn
die echten Plakate da sind. Lokal neu bauen: `node scripts/build-bikes.mjs`.
