// Each poster's median colour behind it (POSTER_BG in config.js): read
// from the image itself once it has loaded, drawn small onto a canvas,
// the median of red, green and blue over its pixels. On a dark colour
// the ink turns white (css: .bike--dark, and .is-dark-current for the
// menu while that poster is the current one).

import { POSTER_BG } from "./config.js";
import { isPhone, phoneQuery } from "./media.js";

// Width of the sample in px; plenty for a median, and quick to read.
const SAMPLE = 48;
// Relative luminance below which white reads better than black (where
// both contrast ratios are equal).
const DARK_BELOW = 0.179;

const body = document.body;
const idle = window.requestIdleCallback || ((job) => setTimeout(job, 1));

function medianColor(img) {
  const w = SAMPLE;
  const h = Math.max(1, Math.round((SAMPLE * img.naturalHeight) / img.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  // A count per value for each channel; the median is where the running
  // count passes half.
  const counts = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    counts[0][data[i]]++;
    counts[1][data[i + 1]]++;
    counts[2][data[i + 2]]++;
    n++;
  }
  if (!n) return null;
  return counts.map((c) => {
    let seen = 0;
    for (let v = 0; v < 256; v++) if ((seen += c[v]) * 2 >= n) return v;
    return 255;
  });
}
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
// The menu takes white ink while a poster on a dark colour is current.
export function syncInk(section) {
  if (section) body.classList.toggle("is-dark-current", section.classList.contains("bike--dark"));
}
function paint(rec) {
  let rgb = null;
  try {
    rgb = medianColor(rec.poster);
  } catch {
    // An image the canvas may not read keeps the plain background.
  }
  if (!rgb) return;
  rec.section.style.backgroundColor = `rgb(${rgb.join(" ")})`;
  rec.section.classList.toggle("bike--dark", luminance(rgb) < DARK_BELOW);
  if (rec.section.classList.contains("is-current")) syncInk(rec.section);
}
// Read only with the page at rest (never mid-swipe), from an image that
// is already decoded, and in a quiet moment after that. Phone posters
// fill the screen and hide the colour, so there it isn't read at all
// (unless the screen grows wider).
export function setupColors(records, stage) {
  if (!POSTER_BG) return;
  function start() {
    if (isPhone()) return;
    records.forEach((rec) => {
      if (rec.colored) return;
      rec.colored = true;
      const img = rec.poster;
      const later = () =>
        (img.decode?.() ?? Promise.resolve())
          .catch(() => {})
          .then(() => stage.atRest(() => idle(() => paint(rec))));
      if (img.complete && img.naturalWidth) later();
      else img.addEventListener("load", later, { once: true });
    });
  }
  start();
  phoneQuery.addEventListener("change", start);
}
