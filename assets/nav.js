/* Shared top menu + in-page sidenav scrollspy.
   Include as the FIRST element inside <body>:  <script src="../assets/nav.js"></script>
   The menu is inserted right where the script tag sits, so there is no flash of unstyled layout. */
(function () {
  // Site root = the folder above /assets/, derived from this script's own URL,
  // so the same file works from index.html, theory/*, instruments/* and history/*.
  const script = document.currentScript;
  const root = new URL("..", script.src);

  const SECTIONS = [
    { label: "Scales", href: "theory/scales.html" },
    { label: "Modes", href: "theory/modes.html" },
    { label: "Blues", href: "theory/blues.html" },
    { label: "Intervals", href: "theory/intervals.html" },
    { label: "ii–V–I", href: "theory/ii-v-i.html" },
    null, // separator
    { label: "Double Bass", href: "instruments/double-bass.html" },
    { label: "Trumpet", href: "instruments/trumpet.html" },
    null,
    { label: "Jazz History", href: "history/jazz-history.html" },
  ];

  const here = location.pathname.replace(/\/$/, "/index.html");
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Site");

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = new URL("index.html", root).href;
  brand.innerHTML = `<span class="logo"></span>Music Theory`;
  nav.appendChild(brand);

  SECTIONS.forEach(s => {
    if (!s) {
      const sep = document.createElement("span");
      sep.className = "sep";
      nav.appendChild(sep);
      return;
    }
    const a = document.createElement("a");
    a.className = "item";
    a.href = new URL(s.href, root).href;
    a.textContent = s.label;
    if (here.endsWith("/" + s.href)) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
    nav.appendChild(a);
  });

  script.parentNode.insertBefore(nav, script);

  /* ---------- In-page sidenav scrollspy ---------- */
  // Highlights whichever .sidenav link matches the panel currently in view.
  // A panel counts as "current" once it enters the top 10%-30% band of the viewport.
  document.addEventListener("DOMContentLoaded", () => {
    const links = Array.from(document.querySelectorAll(".sidenav a[data-target]"));
    if (!links.length) return;
    const setActive = id => links.forEach(a => a.classList.toggle("active", a.dataset.target === id));
    setActive(links[0].dataset.target);
    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-10% 0px -70% 0px", threshold: 0 });
    links.forEach(a => {
      const target = document.getElementById(a.dataset.target);
      if (target) spy.observe(target);
    });
  });
})();
