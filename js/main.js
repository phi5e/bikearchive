(function () {
  const bikes = window.BIKES || [];
  const archive = document.getElementById("archive");
  const listItems = document.getElementById("bike-list-items");
  const toggle = document.getElementById("list-toggle");
  const openWord = toggle.querySelector('[data-word="open"]');
  const closeWord = toggle.querySelector('[data-word="close"]');

  // Build the posters and the list from js/bikes.js.
  bikes.forEach((bike, i) => {
    const id = `bike-${String(i + 1).padStart(2, "0")}`;

    const section = document.createElement("section");
    section.className = "bike";
    section.id = id;
    section.innerHTML = `
      <img class="bike__poster" alt="" loading="${i < 2 ? "eager" : "lazy"}" />
      <div class="bike__caption">
        <span class="bike__year"></span>
        <span class="bike__name"></span>
      </div>
    `;
    const img = section.querySelector(".bike__poster");
    img.src = bike.image;
    img.alt = `Plakat: ${bike.name}`;
    section.querySelector(".bike__year").textContent = bike.year;
    // One span per letter (rise + wave), inside one span that holds
    // them (the outer span keeps the parallax).
    const name = section.querySelector(".bike__name");
    name.setAttribute("aria-label", bike.name);
    const inner = document.createElement("span");
    inner.className = "bike__name-inner";
    inner.setAttribute("aria-hidden", "true");
    Array.from(bike.name).forEach((ch) => {
      const c = document.createElement("span");
      c.className = "bike__char";
      c.textContent = ch;
      inner.appendChild(c);
    });
    name.appendChild(inner);
    archive.appendChild(section);

    const li = document.createElement("li");
    li.className = "bike-list__item";
    li.dataset.target = id;
    li.style.setProperty("--i", i);
    li.innerHTML = `<a href="#${id}"></a>`;
    li.querySelector("a").textContent = bike.name;
    listItems.appendChild(li);
  });

  // Fit every name to one line: as large as the width allows, never
  // above the CSS cap (160px). Measured on the inner span, whose
  // offsetWidth ignores the letters' wave transforms.
  const names = Array.from(document.querySelectorAll(".bike__name"));
  function fitNames() {
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 160;
    names.forEach((el) => {
      el.style.fontSize = `${cap}px`;
      const available = el.parentElement.clientWidth;
      const needed = el.firstElementChild.offsetWidth;
      const size = needed > available ? cap * (available / needed) : cap;
      el.style.fontSize = `${Math.floor(size * 100) / 100}px`;
    });
  }
  // The list sits right of the toggle (as wide as "close list") and
  // ends where the tallest caption (year + big name) begins.
  const root = document.documentElement;
  function layout() {
    fitNames();
    root.style.setProperty("--toggle-w", `${toggle.offsetWidth}px`);
    const captions = Array.from(document.querySelectorAll(".bike__caption"));
    const tallest = Math.max(0, ...captions.map((c) => c.offsetHeight));
    const gutter = captions[0] ? parseFloat(getComputedStyle(captions[0]).bottom) : 0;
    root.style.setProperty("--list-bottom", `${Math.ceil(tallest + gutter + 16)}px`);
  }
  layout();
  document.fonts.ready.then(layout);
  window.addEventListener("resize", layout);

  // Parallax: while a poster passes through the screen, the poster,
  // the name and the year drift at different speeds.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = Array.from(document.querySelectorAll(".bike"));
  const layers = sections.map((s) => ({
    section: s,
    poster: s.querySelector(".bike__poster"),
    year: s.querySelector(".bike__year"),
    name: s.querySelector(".bike__name"),
  }));
  let ticking = false;
  function parallax() {
    ticking = false;
    const vh = window.innerHeight;
    layers.forEach(({ section, poster, year, name }) => {
      const top = section.getBoundingClientRect().top;
      if (top > vh || top < -vh) return;
      const p = top / vh; // 0 when the poster fills the screen, ±1 one screen away
      poster.style.transform = `translate3d(0, ${p * -6}vh, 0)`;
      name.style.transform = `translate3d(0, ${p * 14}vh, 0)`;
      year.style.transform = `translate3d(0, ${p * 26}vh, 0)`;
    });
  }
  if (!reduceMotion) {
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }
    }, { passive: true });
    window.addEventListener("resize", parallax);
    parallax();
  }

  // Name entrance, played each time a poster comes into view (from
  // either direction):
  // 1. the letters rise from below the screen edge one after another,
  // 2. meanwhile a wave runs over the word, to the left and back to the
  //    right: letters under it stretch, the others squeeze, like looking
  //    through moving glass. The name's left and right edges never move;
  //    only the widths inside redistribute.
  // A horizontal blur follows the wave's speed (motion blur).
  const blurDev = document.getElementById("name-blur-dev");
  const entrances = new Map();

  const RISE = 1.1; // seconds per letter
  const STAGGER = 0.03;
  const WAVE_START = 0.1;
  const WAVE_LEG = 0.95; // one pass, left or right
  const riseEase = gsap.parseEase("power4.out");
  const legEase = gsap.parseEase("sine.inOut");

  function hideName(name) {
    const inner = name.firstElementChild;
    const gutter = parseFloat(getComputedStyle(name.parentElement).bottom) || 0;
    const drop = inner.offsetHeight + gutter + 40;
    inner.style.visibility = "hidden";
    inner.style.filter = "none";
    Array.from(inner.children).forEach((c) => {
      c.style.transform = `translate3d(0, ${drop}px, 0)`;
    });
  }

  function restName(name) {
    const inner = name.firstElementChild;
    inner.style.visibility = "";
    inner.style.filter = "none";
    Array.from(inner.children).forEach((c) => { c.style.transform = ""; });
  }

  function playName(name) {
    const inner = name.firstElementChild;
    const chars = Array.from(inner.children);
    entrances.get(name)?.kill();
    restName(name);

    // Resting geometry: each letter's width and centre (0..1 of the name).
    const widths = chars.map((c) => c.offsetWidth);
    const total = widths.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const centres = widths.map((w) => { const m = (acc + w / 2) / total; acc += w; return m; });
    const gutter = parseFloat(getComputedStyle(name.parentElement).bottom) || 0;
    const drop = inner.offsetHeight + gutter + 40;
    const sigma = Math.max(0.09, 1.2 / chars.length);

    inner.style.filter = "url(#name-blur)";
    const state = { t: 0 };
    const duration = Math.max(RISE + STAGGER * (chars.length - 1), WAVE_START + 2 * WAVE_LEG);
    let lastCentre = null;

    function render() {
      const t = state.t;
      // Wave centre: from right of the word to left of it, then back.
      const w = t - WAVE_START;
      let centre;
      if (w < WAVE_LEG) centre = 1.15 - 1.3 * legEase(Math.max(w, 0) / WAVE_LEG);
      else centre = -0.15 + 1.3 * legEase(Math.min((w - WAVE_LEG) / WAVE_LEG, 1));
      // Strength fades in at the start and out at the end.
      const life = Math.min(Math.max(w / (2 * WAVE_LEG), 0), 1);
      const amp = 1.7 * Math.sin(Math.PI * life);

      // Stretch under the wave, then rescale so the widths still add up
      // to the resting width: the letters elsewhere get squeezed.
      const raw = centres.map((m) => 1 + amp * Math.exp(-((m - centre) ** 2) / (2 * sigma * sigma)));
      const sum = raw.reduce((a, r, i) => a + r * widths[i], 0);
      const k = total / sum;

      let x = 0;
      let offset = 0;
      chars.forEach((c, i) => {
        const sx = raw[i] * k;
        const p = Math.min(Math.max((t - i * STAGGER) / RISE, 0), 1);
        const y = drop * (1 - riseEase(p));
        c.style.transform = `translate3d(${(x - offset).toFixed(2)}px, ${y.toFixed(2)}px, 0) scaleX(${sx.toFixed(4)})`;
        x += widths[i] * sx;
        offset += widths[i];
      });

      const speed = lastCentre === null ? 0 : Math.abs(centre - lastCentre);
      lastCentre = centre;
      const blur = Math.min(speed * amp * 220, 10);
      blurDev.setAttribute("stdDeviation", `${blur.toFixed(2)} 0`);
    }

    const tween = gsap.to(state, {
      t: duration,
      duration,
      ease: "none",
      onUpdate: render,
      onComplete() {
        restName(name);
        blurDev.setAttribute("stdDeviation", "0 0");
      },
    });
    render();
    entrances.set(name, tween);
  }

  if (window.gsap && !reduceMotion) {
    names.forEach(hideName);
    const nameSections = sections.map((s) => ({ section: s, name: s.querySelector(".bike__name") }));
    // Checked on every scroll frame (an IntersectionObserver misses a
    // poster that ends exactly at the screen edge, which scroll snap
    // makes the normal case).
    function checkNames() {
      const vh = window.innerHeight;
      nameSections.forEach(({ section, name }) => {
        const r = section.getBoundingClientRect();
        const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        if (visible >= vh * 0.55) {
          if (!entrances.has(name)) playName(name);
        } else if (visible <= 1 && entrances.has(name)) {
          // Off screen: reset, so it plays from scratch next time.
          entrances.get(name).kill();
          entrances.delete(name);
          hideName(name);
        }
      });
    }
    let nameTick = false;
    window.addEventListener("scroll", () => {
      if (!nameTick) {
        nameTick = true;
        requestAnimationFrame(() => { nameTick = false; checkNames(); });
      }
    }, { passive: true });
    document.fonts.ready.then(() => {
      layout();
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames();
    });
    window.addEventListener("resize", () => {
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames();
    });
  }

  // "bike archive" keeps switching typefaces.
  const title = document.getElementById("topbar-title");
  const faces = [
    { family: "Instrument Serif", weight: 400, style: "normal" },
    { family: "Bodoni Moda", weight: 700, style: "italic" },
    { family: "Space Mono", weight: 400, style: "normal" },
    { family: "Syne", weight: 800, style: "normal" },
    { family: "Unbounded", weight: 600, style: "normal" },
    { family: "Fraunces", weight: 300, style: "italic" },
    { family: "Pixelify Sans", weight: 400, style: "normal" },
    { family: "Rubik Mono One", weight: 400, style: "normal" },
    { family: "Major Mono Display", weight: 400, style: "normal" },
    { family: "Inter Tight", weight: 400, style: "normal" },
  ];
  function setFace(f) {
    title.style.fontFamily = `"${f.family}", var(--font-sans)`;
    title.style.fontWeight = f.weight;
    title.style.fontStyle = f.style;
  }
  setFace(faces[0]);
  if (!reduceMotion) {
    // Only start once every face is in, so it never flashes a fallback.
    Promise.all(faces.map((f) => document.fonts.load(`${f.style} ${f.weight} 16px "${f.family}"`, "bike archive")))
      .catch(() => {})
      .then(() => {
        let i = 0;
        setInterval(() => {
          i = (i + 1) % faces.length;
          setFace(faces[i]);
        }, 320);
      });
  }

  // view list ↔ close list
  function setOpen(open) {
    document.body.classList.toggle("is-list-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    openWord.setAttribute("aria-hidden", String(open));
    closeWord.setAttribute("aria-hidden", String(!open));
  }
  toggle.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("is-list-open"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  listItems.addEventListener("click", (e) => {
    const li = e.target.closest(".bike-list__item");
    if (!li) return;
    e.preventDefault();
    document.getElementById(li.dataset.target).scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${li.dataset.target}`);
    setOpen(false);
  });

  // Mark the poster currently on screen in the list.
  const byTarget = new Map(Array.from(listItems.children).map((li) => [li.dataset.target, li]));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        byTarget.forEach((li, id) => li.classList.toggle("is-current", id === entry.target.id));
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll(".bike").forEach((s) => observer.observe(s));
})();
