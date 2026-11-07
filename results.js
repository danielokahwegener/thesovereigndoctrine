// Results section: plays the Likes You recording while it is on screen,
// and opens the proof screenshots in a swipeable viewer.
(function resultsSection() {
  const section = document.getElementById("results");
  if (!section) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- video: play only while visible ----------
  const video = document.getElementById("resultsVideo");
  if (video) {
    let played = false;
    const showControls = () => video.setAttribute("controls", "");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showControls();
    } else {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().then(() => {
                if (!played) {
                  played = true;
                  if (typeof track === "function") track("results_video_play");
                }
              }).catch(showControls);
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.4 }
      ).observe(video);
    }
  }

  // ---------- screenshot viewer ----------
  const shots = [];
  section.querySelectorAll(".shot[data-index]").forEach((btn) => {
    const i = Number(btn.dataset.index);
    if (!shots[i]) shots[i] = { src: btn.dataset.full, alt: btn.querySelector("img").alt };
  });
  if (!shots.length) return;

  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Screenshot viewer");
  box.innerHTML =
    '<img class="lightbox-img" alt="" />' +
    '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous screenshot">&#8249;</button>' +
    '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next screenshot">&#8250;</button>' +
    '<p class="lightbox-count" aria-live="polite"></p>';
  document.body.appendChild(box);

  const img = box.querySelector(".lightbox-img");
  const count = box.querySelector(".lightbox-count");
  const closeBtn = box.querySelector(".lightbox-close");
  let current = 0;
  let opener = null;

  function show(i) {
    current = (i + shots.length) % shots.length;
    img.src = shots[current].src;
    img.alt = shots[current].alt;
    count.textContent = `${current + 1} of ${shots.length}`;
  }

  function open(i, trigger) {
    opener = trigger;
    show(i);
    box.hidden = false;
    document.body.classList.add("lightbox-open");
    closeBtn.focus();
    if (typeof track === "function") track("results_screenshot_open", { index: i });
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }

  section.addEventListener("click", (e) => {
    const btn = e.target.closest(".shot[data-index]");
    if (btn) open(Number(btn.dataset.index), btn);
  });

  closeBtn.addEventListener("click", close);
  box.querySelector(".lightbox-prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lightbox-next").addEventListener("click", () => show(current + 1));
  box.addEventListener("click", (e) => {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });

  let touchX = null;
  box.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });
})();
