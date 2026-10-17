// Entry point: builds the page and wires the modules together.

import { buildArchive } from "./site/build.js";
import { createEntrance } from "./site/entrance.js";
import { createLayout, sizePosters } from "./site/layout.js";
import { reduceMotion, waitsForFinger } from "./site/media.js";
import { setupOverlays } from "./site/overlays.js";
import { setupScroll } from "./site/scroll.js";

const archive = document.getElementById("archive");
const records = buildArchive(window.BIKES || [], archive, document.getElementById("bike-list-items"));
const layout = createLayout(records);
const motion = !!window.gsap && !reduceMotion;
document.documentElement.classList.toggle("has-motion", motion);
const blurDev = document.getElementById("name-blur-dev");
const entrances = motion ? records.map((rec) => createEntrance(rec, blurDev)) : null;
entrances?.forEach((e) => e.hide());
const stage = setupScroll({ records, entrances });
setupOverlays({ records, stage, archive });
sizePosters();
layout();
stage.update();
document.fonts.ready.then(() => {
  layout();
  stage.arm();
});
// Phone browsers resize the screen whenever their bars grow or shrink;
// there only a new width needs the names fitted again.
let width = innerWidth;
window.addEventListener("resize", () => {
  sizePosters();
  if (innerWidth !== width || !waitsForFinger()) {
    width = innerWidth;
    layout();
  }
  stage.update();
});
