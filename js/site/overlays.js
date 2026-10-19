// List, manifesto and lightbox.

import { LIST_FADE_MS } from "./config.js";
import { isPhone } from "./media.js";

export function setupOverlays({ records, stage, archive }) {
  const body = document.body;
  const toggle = document.getElementById("list-toggle");
  const openWord = toggle.querySelector('[data-word="open"]');
  const closeWord = toggle.querySelector('[data-word="close"]');
  const listNav = document.getElementById("bike-list");
  const listItems = document.getElementById("bike-list-items");
  const infoToggle = document.getElementById("info-toggle");
  const info = document.getElementById("info");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const isOpen = (name) => body.classList.contains(name);
  // Keys go back to the page (not a hidden overlay) once one closes.
  const refocus = () => archive.focus({ preventScroll: true });
  function setList(open) {
    if (open && isPhone()) {
      listItems.scrollTop = 0;
    } else if (open) {
      const li = listItems.querySelector(".is-current") || listItems.children[Math.floor(listItems.children.length / 2)];
      // The current bike on the toggle's line (--list-up from the top).
      const line = parseFloat(getComputedStyle(listNav).getPropertyValue("--list-up")) || listNav.clientHeight / 2;
      if (li) listNav.scrollTop = li.offsetTop + li.offsetHeight / 2 - line;
    }
    body.classList.toggle("is-list-open", open);
    if (!open) refocus();
    toggle.setAttribute("aria-expanded", String(open));
    openWord.setAttribute("aria-hidden", String(open));
    closeWord.setAttribute("aria-hidden", String(!open));
  }
  function setInfo(open) {
    if (open) setList(false);
    body.classList.toggle("is-info-open", open);
    // Keys scroll the text while it is open.
    if (open) info.focus({ preventScroll: true });
    else refocus();
    infoToggle.textContent = open ? "close" : "manifesto";
    infoToggle.setAttribute("aria-expanded", String(open));
    info.setAttribute("aria-hidden", String(!open));
  }
  function setLightbox(poster) {
    if (poster) {
      lightboxImg.src = poster.currentSrc || poster.src;
      lightboxImg.alt = poster.alt;
    }
    body.classList.toggle("is-lightbox-open", !!poster);
    if (!poster) refocus();
    lightbox.setAttribute("aria-hidden", String(!poster));
  }
  toggle.addEventListener("click", () => setList(!isOpen("is-list-open")));
  document.getElementById("list-close").addEventListener("click", () => setList(false));
  listItems.addEventListener("click", (e) => {
    const li = e.target.closest(".bike-list__item");
    if (!li) return;
    e.preventDefault();
    const rec = records.find((r) => r.id === li.dataset.target);
    history.replaceState(null, "", `#${rec.id}`);
    setList(false);
    if (isPhone()) setTimeout(() => stage.jumpTo(rec.section), LIST_FADE_MS);
    else stage.jumpTo(rec.section);
  });
  infoToggle.addEventListener("click", (e) => {
    e.preventDefault();
    setInfo(!isOpen("is-info-open"));
  });
  archive.addEventListener("click", (e) => {
    const rec = records.find((r) => r.section.contains(e.target));
    if (rec) setLightbox(rec.poster);
  });
  lightbox.addEventListener("click", () => setLightbox(null));
  // The lightbox covers the posters: wheel and keys mustn't move them
  // underneath, or closing it lands on another bike.
  const SCROLL_KEYS = [" ", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End"];
  // Phones: a drag on the list overlay outside the names (around "close")
  // mustn't scroll the posters behind it.
  listNav.addEventListener("touchmove", (e) => {
    if (isPhone() && !e.target.closest(".bike-list__items")) e.preventDefault();
  }, { passive: false });
  window.addEventListener("wheel", (e) => {
    if (isOpen("is-lightbox-open")) e.preventDefault();
  }, { passive: false });
  document.addEventListener("keydown", (e) => {
    if (isOpen("is-lightbox-open") && SCROLL_KEYS.includes(e.key)) e.preventDefault();
    if (e.key !== "Escape") return;
    setList(false);
    setInfo(false);
    setLightbox(null);
  });
}
