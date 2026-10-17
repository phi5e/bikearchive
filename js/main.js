// Entry point: builds the page and wires the modules together.

import { buildArchive } from "./site/build.js";
import { createEntrance } from "./site/entrance.js";
import { createLayout } from "./site/layout.js";
import { reduceMotion } from "./site/media.js";
import { setupOverlays } from "./site/overlays.js";
import { setupScroll } from "./site/scroll.js";

const scroller = document.getElementById("archive");
const records = buildArchive(window.BIKES || [], scroller, document.getElementById("bike-list-items"));
const layout = createLayout(records);
const motion = !!window.gsap && !reduceMotion;
document.documentElement.classList.toggle("has-motion", motion);
const blurDev = document.getElementById("name-blur-dev");
const entrances = motion ? records.map((rec) => createEntrance(rec, blurDev)) : null;
entrances?.forEach((e) => e.hide());
const stage = setupScroll({ scroller, records, entrances });
setupOverlays({ records, stage, scroller });
scroller.focus({ preventScroll: true });
layout();
stage.update();
document.fonts.ready.then(() => {
  layout();
  stage.arm();
});
window.addEventListener("resize", () => {
  layout();
  stage.update();
});
