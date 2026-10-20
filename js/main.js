// Entry point: builds the page and wires the modules together.

import { buildArchive } from "./site/build.js";
import { setupColors } from "./site/colors.js";
import { createEntrance } from "./site/entrance.js";
import { NAME_SPOT } from "./site/config.js";
import { createLayout, sizePosters } from "./site/layout.js";
import { reduceMotion, swipes, waitsForFinger } from "./site/media.js";
import { setupOverlays } from "./site/overlays.js";
import { setupScroll } from "./site/scroll.js";

const archive = document.getElementById("archive");
document.documentElement.classList.add(`names-${NAME_SPOT}`);
document.documentElement.classList.toggle("is-swipe", swipes);
const records = buildArchive(window.BIKES || [], archive, document.getElementById("bike-list-items"));
const layout = createLayout(records);
const motion = !!window.gsap && !reduceMotion;
document.documentElement.classList.toggle("has-motion", motion);
const blurDev = document.getElementById("name-blur-dev");
const entrances = motion ? records.map((rec) => createEntrance(rec, blurDev)) : null;
entrances?.forEach((e) => e.hide());
const stage = setupScroll({ records, entrances, archive });
setupColors(records, stage);
setupOverlays({ records, stage, archive });
sizePosters();
layout();
stage.update();
document.fonts.ready.then(() => {
  layout();
  stage.arm();
});
// Phone browsers resize the screen whenever their bars grow or shrink;
// there only a new width needs the names fitted again. Posters are only
// resized with the page at rest (never mid-swipe), and after a new width
// has settled.
let width = innerWidth;
let widthTimer = 0;
function resized() {
  sizePosters();
  stage.realign();
  if (innerWidth !== width || !waitsForFinger()) {
    width = innerWidth;
    layout();
  }
  stage.update();
}
window.addEventListener("resize", () => {
  clearTimeout(widthTimer);
  if (innerWidth !== width) widthTimer = setTimeout(() => stage.atRest(resized), 250);
  else stage.atRest(resized);
  stage.update();
});
