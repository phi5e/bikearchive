// Fits the names to the screen width.

import { isPhone } from "./media.js";

let metrics = null;
function nameMetrics(el) {
  if (metrics) return metrics;
  const cs = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const h = ctx.measureText("H");
  const found = {
    cap: h.actualBoundingBoxAscent / 100,
    ascent: h.fontBoundingBoxAscent / 100,
    descent: h.fontBoundingBoxDescent / 100
  };
  if (document.fonts.status === "loaded") metrics = found;
  return found;
}
const floor2 = (n) => Math.floor(n * 100) / 100;
function fitPhone(rec, cap) {
  const { name, words } = rec;
  const size = cap * 0.6;
  name.style.fontSize = `${size}px`;
  const available = name.parentElement.clientWidth;
  const widest = Math.max(1, ...words.map((w) => w.offsetWidth));
  const fitted = floor2(widest > available ? size * (available / widest) : size);
  name.style.fontSize = `${fitted}px`;
  const m = nameMetrics(name);
  const lineHeight = m.cap * fitted + 5;
  name.style.lineHeight = `${lineHeight.toFixed(2)}px`;
  const capTop = (lineHeight - (m.ascent + m.descent) * fitted) / 2 + (m.ascent - m.cap) * fitted;
  name.style.paddingTop = capTop < 0 ? `${Math.ceil(-capTop)}px` : "";
}
function fitDesktop(rec, cap) {
  const { name, inner } = rec;
  name.style.lineHeight = "";
  name.style.paddingTop = "";
  name.style.fontSize = `${cap}px`;
  const available = name.parentElement.clientWidth;
  const needed = inner.offsetWidth;
  name.style.fontSize = `${floor2(needed > available ? cap * (available / needed) : cap)}px`;
}
export function fitNames(records) {
  const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 160;
  const fit = isPhone() ? fitPhone : fitDesktop;
  records.forEach((rec) => fit(rec, cap));
}
