# astalla bici – bike archive

Eine Seite, ein Plakat pro Bildschirm; das Plakat ist 80% der
Bildschirmhöhe hoch, mittig zwischen Menü und unterem Rand. Unten links steht der
Rahmenname (bei zwei Wörtern oder mehr mindestens zweizeilig: das erste Wort, die Marke, steht allein
in der ersten Zeile, der Rest darunter; skaliert mit der Breite,
max. 160px, Archivo Expanded Black), darüber das Jahr (13.5px). Beim
Scrollen (in beide Richtungen) gleitet jeder Buchstabe einzeln von rechts
in seinen Platz, wie hinter einem unsichtbaren Vorhang hervor (vom letzten
zum ersten). Gleichzeitig läuft eine Welle einmal von rechts nach links
über den Namen, Zeile für Zeile von unten nach oben, und dehnt und staucht
einzelne Buchstaben; die Außenkanten jeder Zeile bleiben dabei fest (GSAP, `js/vendor/`). Springt man 2+ Plakate weiter
(schnelles Scrollen, Sprung aus der Liste), animieren die überflogenen
Namen nicht; der Name am Ziel startet kurz nachdem das Scrollen stoppt. Links mittig öffnet „view list“
die Liste aller Räder, mittig auf dieser Linie (der aktuelle Name steht
auf der Linie, die anderen darüber und darunter). Oben: Logo, „bike
archive“ und „info“, ohne Hintergrund.

Variante (zum Ausprobieren): Die Namen kommen in Instrument Serif herein
und verschmelzen dabei zur breiten Sans. Abschalten: in `js/site/config.js`
`MORPH_FROM_SERIF = false` setzen.

Plain HTML/CSS/JS, kein Build. `index.html` hosten (die Skripte sind
ES-Module, darum über einen Server öffnen, nicht per Doppelklick).

## Live und Test

Netlify baut den Branch `claude/bike-archive-page-y0w7o8` als Live-Seite
(astallabici.de; jedes Deploy kostet Credits). Der Branch
`claude/mobile-scroll-fix-h5rz9g` ist als Branch-Deploy eingetragen: jeder
Push dorthin baut einen Testlink (`claude-mobile-scroll-fix-h5rz9g--…netlify.app`,
in Netlify unter Deploys), der in jedem Browser läuft und keine
Deploy-Credits kostet.

## Code

- `js/main.js`: Einstieg, verbindet die Module.
- `js/site/config.js`: Schalter und Zeiten (Morph, Logo-Rollen, Bildrate des Namens (`ENTRANCE_FPS`, im Moment ohne Limit), Einrasten, Blättern am Handy: `PHONE_BROWSING`, getrennt für Safari und alle anderen Browser, Namensposition: `NAME_SPOT`, Plakatfarbe als Hintergrund: `POSTER_BG`).
- `js/site/build.js`: baut Plakate und Liste aus `js/bikes.js`.
- `js/site/media.js`: Media Queries (Handy, reduzierte Bewegung), erkennt Safari.
- `js/site/fit.js`: passt die Namen an die Breite an.
- `js/site/layout.js`: gemessene Größen (Liste, Logo).
- `js/site/entrance.js`: Auftritt von Name und Jahr.
- `js/site/scroll.js`: die Seite scrollt und rastet ein (im Wisch-Modus bewegt sich stattdessen das Plakat-Band), Vorladen, wann ein Name startet.
- `js/site/swipe.js`: Wisch-Modus (`"swipe"` in `PHONE_BROWSING`, im Moment für alle Browser außer Safari): Wischen, Pfeile, Mausrad und Tasten blättern ein Rad weiter, die Seite selbst bewegt sich nie.
- `js/site/colors.js`: hinter jedem Plakat seine Medianfarbe (aus dem Bild gelesen, sobald es geladen ist und die Seite ruht); auf dunklen Farben wird die Schrift weiß. Nicht am Handy, dort füllt das Bild den ganzen Bildschirm.
- `js/site/overlays.js`: Liste, Manifesto, Lightbox.

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
