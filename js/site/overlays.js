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
  function setList(open) {
    if (open && isPhone()) {
      listItems.scrollTop = 0;
    } else if (open) {
      const li = listItems.querySelector(".is-current") || listItems.children[Math.floor(listItems.children.length / 2)];
      if (li) listNav.scrollTop = li.offsetTop + li.offsetHeight / 2 - listNav.clientHeight / 2;
    }
    body.classList.toggle("is-list-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    openWord.setAttribute("aria-hidden", String(open));
    closeWord.setAttribute("aria-hidden", String(!open));
  }
  function setInfo(open) {
    if (open) setList(false);
    body.classList.toggle("is-info-open", open);
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
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setList(false);
    setInfo(false);
    setLightbox(null);
  });
}
