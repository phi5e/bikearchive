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
    section.querySelector(".bike__name").textContent = bike.name;
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
  // above the CSS cap (120px).
  const names = Array.from(document.querySelectorAll(".bike__name"));
  function fitNames() {
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 120;
    names.forEach((el) => {
      el.style.fontSize = `${cap}px`;
      const available = el.parentElement.clientWidth;
      const needed = el.scrollWidth;
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
