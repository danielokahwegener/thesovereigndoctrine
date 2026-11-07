// ---------------------------------------------------------
// Scroll reveal: fade/slide in any .reveal element once it
// enters the viewport. Unobserve after reveal so it doesn't
// re-trigger on scroll-up.
// ---------------------------------------------------------
(function scrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || revealEls.length === 0) {
    revealEls.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

// ---------------------------------------------------------
// VSL video unmute toggle (video starts muted so it can autoplay)
// ---------------------------------------------------------
(function vslVideo() {
  const video = document.querySelector(".vsl-video");
  const btn = document.getElementById("videoUnmuteBtn");
  if (!video || !btn) return;

  btn.addEventListener("click", () => {
    video.muted = !video.muted;
    btn.classList.toggle("is-unmuted", !video.muted);
    btn.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
  });
})();

// ---------------------------------------------------------
// VSL video play/pause toggle
// ---------------------------------------------------------
(function vslPlayPause() {
  const video = document.querySelector(".vsl-video");
  const btn = document.getElementById("videoPlayPauseBtn");
  if (!video || !btn) return;

  function syncState() {
    const isPaused = video.paused;
    btn.classList.toggle("is-paused", isPaused);
    btn.setAttribute("aria-label", isPaused ? "Play video" : "Pause video");
  }

  btn.addEventListener("click", () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  video.addEventListener("play", syncState);
  video.addEventListener("pause", syncState);
  syncState();
})();

// ---------------------------------------------------------
// VSL video scrub bar (elapsed / remaining time, click + drag to seek)
// ---------------------------------------------------------
(function vslProgress() {
  const video = document.querySelector(".vsl-video");
  const progress = document.getElementById("videoProgress");
  const fill = document.getElementById("videoProgressFill");
  const thumb = document.getElementById("videoProgressThumb");
  const elapsedEl = document.getElementById("videoTimeElapsed");
  const remainingEl = document.getElementById("videoTimeRemaining");
  if (!video || !progress || !fill || !elapsedEl || !remainingEl) return;

  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateProgress() {
    const duration = video.duration || 0;
    const current = video.currentTime || 0;
    const pct = duration ? (current / duration) * 100 : 0;
    fill.style.width = pct + "%";
    if (thumb) thumb.style.left = pct + "%";
    elapsedEl.textContent = formatTime(current);
    remainingEl.textContent = duration ? "-" + formatTime(duration - current) : "0:00";
  }

  function seekToClientX(clientX) {
    if (!isFinite(video.duration)) return;
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
  }

  let dragging = false;

  progress.addEventListener("pointerdown", (e) => {
    dragging = true;
    progress.classList.add("is-dragging");
    seekToClientX(e.clientX);
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    seekToClientX(e.clientX);
  });

  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    progress.classList.remove("is-dragging");
  });

  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("loadedmetadata", updateProgress);
  updateProgress();
})();

// ---------------------------------------------------------
// VSL video quality selector — swaps the source while preserving
// the current playback position and play/pause state.
// ---------------------------------------------------------
(function vslQuality() {
  const video = document.querySelector(".vsl-video");
  const wrapper = document.getElementById("videoQuality");
  const btn = document.getElementById("videoQualityBtn");
  const menu = document.getElementById("videoQualityMenu");
  if (!video || !wrapper || !btn || !menu) return;

  const qualitySources = {
    "1080p": "assets/vsl-1080p.mp4",
    "720p": "assets/vsl-720p.mp4",
    "480p": "assets/vsl-480p.mp4",
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrapper.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", wrapper.classList.contains("is-open"));
  });

  document.addEventListener("click", () => {
    wrapper.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  });

  menu.querySelectorAll(".video-quality-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const quality = option.dataset.quality;
      const src = qualitySources[quality];
      if (!src) return;

      const resumeTime = video.currentTime;
      const wasPlaying = !video.paused;

      const onLoaded = () => {
        video.currentTime = resumeTime;
        if (wasPlaying) video.play().catch(() => {});
        video.removeEventListener("loadedmetadata", onLoaded);
      };
      video.addEventListener("loadedmetadata", onLoaded);

      video.querySelector("source").src = src;
      video.load();

      menu.querySelectorAll(".video-quality-option").forEach((o) => o.classList.remove("is-active"));
      option.classList.add("is-active");
      wrapper.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
})();

// ---------------------------------------------------------
// VSL video fullscreen toggle
// ---------------------------------------------------------
(function vslFullscreen() {
  const frame = document.querySelector(".video-frame");
  const btn = document.getElementById("videoFullscreenBtn");
  if (!frame || !btn) return;

  btn.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      frame.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === frame;
    btn.classList.toggle("is-fullscreen", isFullscreen);
    btn.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
  });
})();

// ---------------------------------------------------------
// Proof strip photo carousels (before / after). The two live inside
// one .proof-images group and are kept in lockstep: a control on
// either one — arrow, dot, swipe, or hover-pause — drives both off a
// single shared index and a single shared autoplay timer, rather than
// each carousel running its own independent state.
// ---------------------------------------------------------
(function proofCarousels() {
  document.querySelectorAll(".proof-images").forEach((group) => {
    const instances = Array.from(group.querySelectorAll("[data-carousel]"))
      .map((carousel) => ({
        carousel,
        track: carousel.querySelector(".proof-carousel-track"),
        slides: Array.from(carousel.querySelectorAll(".proof-carousel-slide")),
        dots: Array.from(carousel.querySelectorAll(".proof-carousel-dot")),
        prevBtn: carousel.querySelector(".proof-carousel-prev"),
        nextBtn: carousel.querySelector(".proof-carousel-next"),
      }))
      .filter((inst) => inst.track && inst.slides.length > 0);
    if (instances.length === 0) return;

    const slideCount = Math.min(...instances.map((inst) => inst.slides.length));
    let index = 0;

    function goTo(newIndex) {
      index = (newIndex + slideCount) % slideCount;
      instances.forEach(({ track, slides, dots }) => {
        track.style.transform = `translateX(-${index * 100}%)`;
        slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
        dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      });
    }

    // Auto-advance every 2s. Paused on hover/touch of EITHER carousel so
    // it doesn't fight a visitor mid-swipe on one while the other keeps
    // moving, and skipped entirely for reduced-motion — this is exactly
    // the kind of auto-moving content that preference exists to suppress.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let autoplayTimer = null;

    function startAutoplay() {
      if (prefersReducedMotion || slideCount <= 1) return;
      stopAutoplay();
      autoplayTimer = setInterval(() => goTo(index + 1), 2000);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    instances.forEach(({ carousel, dots, prevBtn, nextBtn }) => {
      prevBtn?.addEventListener("click", () => {
        goTo(index - 1);
        startAutoplay();
      });
      nextBtn?.addEventListener("click", () => {
        goTo(index + 1);
        startAutoplay();
      });
      dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
          goTo(i);
          startAutoplay();
        });
      });

      carousel.addEventListener("pointerenter", stopAutoplay);
      carousel.addEventListener("pointerleave", startAutoplay);

      // swipe: track horizontal drag distance, change slide on release
      let dragStartX = null;

      carousel.addEventListener("pointerdown", (e) => {
        dragStartX = e.clientX;
        stopAutoplay();
      });

      carousel.addEventListener("pointerup", (e) => {
        if (dragStartX === null) return;
        const delta = e.clientX - dragStartX;
        dragStartX = null;
        if (Math.abs(delta) >= 40) goTo(delta < 0 ? index + 1 : index - 1);
        startAutoplay();
      });

      if (slideCount <= 1) {
        prevBtn?.style.setProperty("display", "none");
        nextBtn?.style.setProperty("display", "none");
        carousel.querySelector(".proof-carousel-dots")?.style.setProperty("display", "none");
      }
    });

    startAutoplay();
  });
})();

// ---------------------------------------------------------
// Analytics — pushes to window.dataLayer so any tag manager
// can pick these up. track() is the single dispatch point.
// ---------------------------------------------------------
window.dataLayer = window.dataLayer || [];

function track(name, payload) {
  window.dataLayer.push({ event: name, ...payload });
}

// ---------------------------------------------------------
// APPLY_URL — declared once, written into every CTA's href so
// the destination can be changed in a single place. The apply
// flow lives on this same page (the embedded form in the hero),
// so every CTA just scrolls there.
// ---------------------------------------------------------
const APPLY_URL = "#apply";

// ---------------------------------------------------------
// SHEET_WEBHOOK_URL — the deployed Google Apps Script Web App
// URL that appends each application as a row in a Google Sheet.
// Leave blank to disable (the form still works, it just won't
// log anywhere). See project notes for the Apps Script source
// and deployment steps.
// ---------------------------------------------------------
const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwk8JQRcgps_qlzmCU03cumgIB-i_rbaN_ld44x84Mf-ahHw7NhV0OkG-sfhYt7XYRw/exec";

document.querySelectorAll("[data-cta-location]").forEach((el) => {
  el.setAttribute("href", APPLY_URL);
  el.addEventListener("click", () => {
    track("cta_click", { location: el.dataset.ctaLocation });
  });
});

// ---------------------------------------------------------
// FAQ — native <details>/<summary>, no JS needed for the
// toggle itself. Only fires the analytics event on open.
// ---------------------------------------------------------
(function faqAnalytics() {
  const items = document.querySelectorAll(".faq-item");

  items.forEach((item, index) => {
    item.addEventListener("toggle", () => {
      if (item.open) track("faq_open", { index });
    });
  });
})();

// ---------------------------------------------------------
// Sticky mobile CTA bar — appears once the hero application
// form has scrolled out of view. IntersectionObserver, not a
// scroll listener. Keeps it out of the tab order while hidden.
// ---------------------------------------------------------
(function stickyCta() {
  const bar = document.getElementById("stickyCta");
  const heroCta = document.getElementById("applyForm");
  if (!bar || !heroCta || !("IntersectionObserver" in window)) return;

  function setBodyPadding(visible) {
    document.body.style.paddingBottom = visible ? bar.offsetHeight + "px" : "";
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const isHeroCtaVisible = entries[0].isIntersecting;
      const showBar = !isHeroCtaVisible;
      bar.classList.toggle("is-visible", showBar);
      bar.setAttribute("aria-hidden", String(!showBar));
      setBodyPadding(showBar);
    },
    { threshold: 0 }
  );

  observer.observe(heroCta);
})();

// ---------------------------------------------------------
// Video analytics — play (fired once) and 25/50/75/100%
// progress milestones, read directly from the video element.
// ---------------------------------------------------------
(function vslAnalytics() {
  const video = document.querySelector(".vsl-video");
  if (!video) return;

  let playTracked = false;
  const firedMilestones = new Set();
  const milestones = [25, 50, 75, 100];

  video.addEventListener("play", () => {
    if (playTracked) return;
    playTracked = true;
    track("video_play", {});
  });

  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    milestones.forEach((m) => {
      if (pct >= m && !firedMilestones.has(m)) {
        firedMilestones.add(m);
        track("video_progress", { percent: m });
      }
    });
  });
})();

// ---------------------------------------------------------
// Scroll depth — 25/50/75/100% of page height, each once.
// ---------------------------------------------------------
(function scrollDepth() {
  const milestones = [25, 50, 75, 100];
  const fired = new Set();
  let ticking = false;

  function checkDepth() {
    ticking = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = (window.scrollY / scrollable) * 100;
    milestones.forEach((m) => {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        track("scroll_depth", { percent: m });
      }
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(checkDepth);
    },
    { passive: true }
  );
})();

// ---------------------------------------------------------
// Phone number country-code selector
// ---------------------------------------------------------
(function phoneCountrySelector() {
  const wrapper = document.getElementById("phoneInput");
  const btn = document.getElementById("phoneCountryBtn");
  const flagEl = document.getElementById("phoneCountryFlag");
  const codeEl = document.getElementById("phoneCountryCode");
  const menu = document.getElementById("phoneCountryMenu");
  const phoneField = document.getElementById("q7");
  if (!wrapper || !btn || !menu) return;

  // Not exhaustive, but covers the countries applicants are most
  // likely to select from. Add more entries the same shape to extend.
  const COUNTRIES = [
    { name: "United States", flag: "🇺🇸", dial: "+1" },
    { name: "Canada", flag: "🇨🇦", dial: "+1" },
    { name: "United Kingdom", flag: "🇬🇧", dial: "+44" },
    { name: "Australia", flag: "🇦🇺", dial: "+61" },
    { name: "New Zealand", flag: "🇳🇿", dial: "+64" },
    { name: "Ireland", flag: "🇮🇪", dial: "+353" },
    { name: "Germany", flag: "🇩🇪", dial: "+49" },
    { name: "France", flag: "🇫🇷", dial: "+33" },
    { name: "Spain", flag: "🇪🇸", dial: "+34" },
    { name: "Italy", flag: "🇮🇹", dial: "+39" },
    { name: "Portugal", flag: "🇵🇹", dial: "+351" },
    { name: "Netherlands", flag: "🇳🇱", dial: "+31" },
    { name: "Belgium", flag: "🇧🇪", dial: "+32" },
    { name: "Switzerland", flag: "🇨🇭", dial: "+41" },
    { name: "Austria", flag: "🇦🇹", dial: "+43" },
    { name: "Sweden", flag: "🇸🇪", dial: "+46" },
    { name: "Norway", flag: "🇳🇴", dial: "+47" },
    { name: "Denmark", flag: "🇩🇰", dial: "+45" },
    { name: "Finland", flag: "🇫🇮", dial: "+358" },
    { name: "Iceland", flag: "🇮🇸", dial: "+354" },
    { name: "Poland", flag: "🇵🇱", dial: "+48" },
    { name: "Czech Republic", flag: "🇨🇿", dial: "+420" },
    { name: "Greece", flag: "🇬🇷", dial: "+30" },
    { name: "Romania", flag: "🇷🇴", dial: "+40" },
    { name: "Hungary", flag: "🇭🇺", dial: "+36" },
    { name: "Ukraine", flag: "🇺🇦", dial: "+380" },
    { name: "Russia", flag: "🇷🇺", dial: "+7" },
    { name: "Turkey", flag: "🇹🇷", dial: "+90" },
    { name: "Israel", flag: "🇮🇱", dial: "+972" },
    { name: "United Arab Emirates", flag: "🇦🇪", dial: "+971" },
    { name: "Saudi Arabia", flag: "🇸🇦", dial: "+966" },
    { name: "South Africa", flag: "🇿🇦", dial: "+27" },
    { name: "Nigeria", flag: "🇳🇬", dial: "+234" },
    { name: "Kenya", flag: "🇰🇪", dial: "+254" },
    { name: "Egypt", flag: "🇪🇬", dial: "+20" },
    { name: "India", flag: "🇮🇳", dial: "+91" },
    { name: "Pakistan", flag: "🇵🇰", dial: "+92" },
    { name: "China", flag: "🇨🇳", dial: "+86" },
    { name: "Japan", flag: "🇯🇵", dial: "+81" },
    { name: "South Korea", flag: "🇰🇷", dial: "+82" },
    { name: "Singapore", flag: "🇸🇬", dial: "+65" },
    { name: "Malaysia", flag: "🇲🇾", dial: "+60" },
    { name: "Indonesia", flag: "🇮🇩", dial: "+62" },
    { name: "Philippines", flag: "🇵🇭", dial: "+63" },
    { name: "Thailand", flag: "🇹🇭", dial: "+66" },
    { name: "Vietnam", flag: "🇻🇳", dial: "+84" },
    { name: "Hong Kong", flag: "🇭🇰", dial: "+852" },
    { name: "Taiwan", flag: "🇹🇼", dial: "+886" },
    { name: "Mexico", flag: "🇲🇽", dial: "+52" },
    { name: "Brazil", flag: "🇧🇷", dial: "+55" },
    { name: "Argentina", flag: "🇦🇷", dial: "+54" },
    { name: "Chile", flag: "🇨🇱", dial: "+56" },
    { name: "Colombia", flag: "🇨🇴", dial: "+57" },
    { name: "Peru", flag: "🇵🇪", dial: "+51" },
    { name: "Jamaica", flag: "🇯🇲", dial: "+1876" },
  ];

  function renderList(filter) {
    const query = (filter || "").trim().toLowerCase();
    const items = query
      ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query))
      : COUNTRIES;

    menu.innerHTML = "";
    items.forEach((country) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "phone-country-option";
      option.setAttribute("role", "option");
      option.innerHTML = `<span>${country.flag}</span><span class="phone-country-option-name">${country.name}</span><span class="phone-country-option-dial">${country.dial}</span>`;
      option.addEventListener("click", () => {
        flagEl.textContent = country.flag;
        codeEl.textContent = country.dial;
        btn.dataset.dialCode = country.dial;
        closeMenu();
        phoneField?.focus();
      });
      menu.appendChild(option);
    });
  }

  function openMenu() {
    renderList();
    wrapper.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    wrapper.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (wrapper.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
})();

// ---------------------------------------------------------
// Multi-step application form
// ---------------------------------------------------------
(function multistepForm() {
  const wrapper = document.getElementById("applyForm");
  if (!wrapper) return;

  const form = wrapper.querySelector("form");
  // Every step in the markup, including one "closer look" step per pillar.
  // Only the step for the man's lowest pillar is ever in the active list,
  // chosen when he finishes the seven pillar questions (see goNext). The
  // active list always holds exactly one of them, so the step count never
  // changes mid way.
  const allSteps = Array.from(wrapper.querySelectorAll(".form-step[data-step]"));
  let dataSteps = [];
  let totalSteps = 0;
  function setDeepDive(pillar) {
    dataSteps = allSteps.filter((step) => !step.dataset.deepdive || step.dataset.deepdive === pillar);
    totalSteps = dataSteps.length;
  }
  setDeepDive("Appearance");
  const bookingUrl = wrapper.dataset.bookingUrl || "booking.html";
  const thankYouUrl = wrapper.dataset.thankYouUrl || "thank-you.html";

  const progressFill = document.getElementById("formProgressFill");
  const stepLabel = document.getElementById("formStepLabel");
  const backBtn = document.getElementById("formBack");
  const nextBtn = document.getElementById("formNext");
  const submitBtn = document.getElementById("formSubmit");
  const formAnchor = document.getElementById("apply");

  const KEYBOARD_INPUT_TYPES = ["text", "email", "tel", "number", "password", "search", "url"];
  function opensKeyboard(field) {
    return !!field && (field.tagName === "TEXTAREA" || KEYBOARD_INPUT_TYPES.includes(field.type));
  }

  let currentIndex = 0;
  let autoAdvanceTimer = null;

  function showStep(index, options) {
    options = options || {};

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }

    allSteps.forEach((step) => step.classList.toggle("is-active", step === dataSteps[index]));

    const progressPct = ((index + 1) / totalSteps) * 100;
    progressFill.style.width = progressPct + "%";
    stepLabel.textContent = `Step ${index + 1} of ${totalSteps}`;

    backBtn.classList.toggle("is-visible", index > 0);
    const isLastStep = index === totalSteps - 1;
    nextBtn.style.display = isLastStep ? "none" : "inline-flex";
    submitBtn.classList.toggle("is-visible", isLastStep);

    // Skip auto-focus for fields that open a virtual keyboard (text, tel,
    // etc). Focusing them programmatically still triggers the OS's
    // keyboard-avoidance scroll on mobile even with preventScroll, which
    // reads as the page abruptly jumping — worst on step 5, the phone
    // field, since it's the last thing a visitor expects to move under them.
    const firstField = dataSteps[index].querySelector("input, select, textarea");
    if (firstField && !opensKeyboard(firstField)) firstField.focus({ preventScroll: true });

    // On an actual step change (not the initial page load), scroll so the
    // form starts from the top — progress bar, step title, and first
    // question all visible together — instead of leaving the view
    // wherever it happened to land on the previous, possibly longer, step.
    if (options.scrollToTop && formAnchor) {
      formAnchor.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    // Funnel tracking — one event per step reached, so drop-off between
    // any two steps is visible in whatever tool consumes dataLayer.
    track("form_step_view", {
      step: index + 1,
      step_name: dataSteps[index].querySelector(".form-step-title")?.textContent || "",
      total_steps: totalSteps,
    });
  }

  // Steps made up entirely of multiple-choice questions can auto-advance
  // once every question is answered — no typing involved, so there's
  // nothing to interrupt by moving on automatically.
  function isRadioOnlyStep(stepEl) {
    const fields = stepEl.querySelectorAll("input, select, textarea");
    return fields.length > 0 && Array.from(fields).every((f) => f.type === "radio");
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (currentIndex < totalSteps - 1) {
      // Leaving the last pillar question: now every pillar is scored, so
      // swap in the closer look step for the lowest one.
      if (dataSteps[currentIndex + 1].dataset.deepdive) {
        setDeepDive(computeScorecard().bottleneck);
      }
      currentIndex += 1;
      showStep(currentIndex, { scrollToTop: true });
    }
  }

  function currentStepFields() {
    return Array.from(
      dataSteps[currentIndex].querySelectorAll("input, select, textarea")
    );
  }

  function validateCurrentStep() {
    const fields = currentStepFields();
    let valid = true;

    // group radios by name so we only need one checked per group
    const seenRadioGroups = new Set();

    fields.forEach((field) => {
      if (field.type === "radio") {
        if (seenRadioGroups.has(field.name)) return;
        seenRadioGroups.add(field.name);
        const group = fields.filter((f) => f.name === field.name);
        const isChecked = group.some((f) => f.checked);
        if (field.required && !isChecked) {
          valid = false;
          group.forEach((f) => f.closest(".form-field").classList.add("touched"));
        } else {
          group.forEach((f) => f.closest(".form-field").classList.remove("touched"));
        }
        return;
      }

      field.classList.add("touched");
      if (field.required && !field.checkValidity()) {
        valid = false;
      }
    });

    return valid;
  }

  nextBtn.addEventListener("click", goNext);

  backBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      showStep(currentIndex, { scrollToTop: true });
    }
  });

  form.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return;

    const stepEl = dataSteps[currentIndex];
    if (!isRadioOnlyStep(stepEl)) return;
    if (!validateCurrentStep()) return;

    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(goNext, 400);
  });

  // ---------------------------------------------------------
  // Attraction Scorecard: scoring, insights, results, lead brief
  // ---------------------------------------------------------
  // Everything below runs in the browser with plain rules. No API, no
  // cost. The seven pillar questions are each answered 1 to 4 and scored.
  // Every other answer is stored as written and used for the insight
  // panels and the lead brief; free text is never scored.
  const answer = (fieldName) =>
    form.querySelector(`input[name="${fieldName}"]:checked`)?.value || "";
  const answerLevel = (fieldName) => {
    const el = form.querySelector(`input[name="${fieldName}"]:checked`);
    return el ? Number(el.dataset.level) : 0;
  };

  // The raw total (7 to 28) maps to a 0 to 100 score. The lowest pillar is
  // the bottleneck. Ties go to the earlier pillar in ATTRACT order, since
  // Appearance decides whether a man gets considered at all before the
  // later pillars matter.
  function computeScorecard() {
    const pillarScores = {};
    dataSteps.forEach((step) => {
      const pillar = step.dataset.pillar;
      if (!pillar) return;
      const checked = step.querySelector('input[type="radio"]:checked');
      pillarScores[pillar] = checked ? Number(checked.value) : 1;
    });

    const pillars = Object.keys(pillarScores);
    const rawTotal = pillars.reduce((sum, p) => sum + pillarScores[p], 0);
    const overall = Math.round(((rawTotal - pillars.length) / (pillars.length * 3)) * 100);

    let bottleneck = pillars[0];
    pillars.forEach((p) => {
      if (pillarScores[p] < pillarScores[bottleneck]) bottleneck = p;
    });

    return { pillarScores, overall, bottleneck };
  }

  // One line per pillar, shown under the score. Short on purpose: the
  // real breakdown happens on the call, this only has to make the result
  // feel specific instead of generic. No claims about client results.
  const BOTTLENECK_COPY = {
    Appearance: "Appearance decides whether you get considered at all, before anything else you do matters. For most men it is the highest leverage place to start.",
    Taste: "Style is usually the fastest pillar to fix, and right now it is working against everything else you are doing.",
    Temperament: "This pillar sits underneath all the others. A man can look the part and still undercut himself here.",
    Rapport: "You are likely getting considered. The gap is turning that into real connection.",
    Attraction: "Women are not responding with the interest you want yet, and that is a skill you can build, not a fixed trait.",
    Courtship: "You are getting attention. The gap is turning it into dates that actually go somewhere.",
    Traction: "You probably already know what to fix. The missing piece is a structure that holds you to it.",
  };

  const LEVEL_LABEL = { 1: "Needs work", 2: "Developing", 3: "Solid", 4: "Strong" };

  // Per pillar read, picked by score: 1 or 2 uses "low", 3 or 4 uses "high".
  const PILLAR_INSIGHT = {
    Appearance: {
      low: "Physique and grooming are the first thing a woman reads, so gains here lift everything else.",
      high: "You have a foundation here. Keep it sharp and make sure it reads well in photos and in person.",
    },
    Taste: {
      low: "Clothes that fit and suit you are one of the quickest upgrades available.",
      high: "Your style is working for you. The next step is making it distinctly yours.",
    },
    Temperament: {
      low: "Nerves and self doubt are likely costing you moments you would otherwise win.",
      high: "You stay steady in situations that rattle most men. That is a real edge.",
    },
    Rapport: {
      low: "Conversations are not yet building the connection that makes a woman want more.",
      high: "You connect well. The skill now is steering that connection somewhere.",
    },
    Attraction: {
      low: "Interest is not landing as attraction yet. This is a learnable skill, not a trait.",
      high: "Women respond to you. The gain is being intentional about it.",
    },
    Courtship: {
      low: "Good first impressions are not turning into dates that go somewhere.",
      high: "You move things forward well. Consistency here compounds.",
    },
    Traction: {
      low: "Without structure and accountability, effort tends to fade after a few weeks.",
      high: "You follow through. That is the pillar most men never build.",
    },
  };

  // "Considered" is whether a woman notices you and gives you a chance.
  // "Chosen" is whether she picks you once she knows you. Traction sits
  // outside both because it is about follow through, not about her.
  const CONSIDERED = ["Appearance", "Taste", "Temperament"];
  const CHOSEN = ["Rapport", "Attraction", "Courtship"];

  // Pillars ranked by how quickly a change usually shows up, used only to
  // pick the fastest win among the pillars that actually have room to grow.
  const WIN_ORDER = ["Taste", "Appearance", "Traction", "Courtship", "Rapport", "Attraction", "Temperament"];
  const WIN_ACTION = {
    Appearance: "Book a proper haircut and pick one training session this week that you will not skip.",
    Taste: "Choose one outfit that fits you properly and wear it the next time you go out. Fit matters more than brand.",
    Temperament: "Start one short conversation with a stranger each day. The goal is to get used to the nerves, not to impress anyone.",
    Rapport: "In your next conversation, ask one follow up question about something she said before moving to a new topic.",
    Attraction: "Show clear interest once this week with one calm, direct sentence, and treat how it lands as information, not a verdict.",
    Courtship: "Plan your next date yourself, venue and time, and suggest the next one before the date ends.",
    Traction: "Write down one dating goal for the next 7 days and tell one person you trust so someone checks in.",
  };

  // Used only in the lead brief, one question to open the call with.
  const OPENING = {
    Appearance: "Ask what a normal training and grooming week looks like, and what has stopped it sticking.",
    Taste: "Ask what they wore on their last date and how they chose it.",
    Temperament: "Ask about the last time nerves cost them a moment with a woman they liked.",
    Rapport: "Ask them to walk through their last real conversation with a woman and where it stalled.",
    Attraction: "Ask how the last woman they were interested in reacted when they showed it.",
    Courtship: "Ask what happened after their last good first date.",
    Traction: "Ask what the last plan they quit looked like and the week it fell apart.",
  };

  // Which pillars each "main thing holding you back" answer points at, used
  // to notice when what a man believes differs from what his scores show.
  const CAUSE_PILLARS = {
    "My looks or style": ["Appearance", "Taste"],
    "My confidence": ["Temperament"],
    "My conversation skills": ["Rapport"],
  };

  // Rough read of where the last 90 days leak, from the three funnel
  // answers (each 0 to 3). Not a statistic, just the first stage where the
  // numbers drop off sharply.
  const FUNNEL_COPY = {
    start: "You did not start many conversations in the last 90 days. Everything else depends on this step, so more real conversations is where progress begins.",
    convert: "You are starting conversations, but few turn into first dates. The leak is what happens between hello and let's meet.",
    followup: "You are getting first dates, but few become second dates. The leak is what happens on the date and in the follow up.",
    volume: "What you do is converting. Your numbers are limited by volume, so more conversations is the lever.",
    none: "No single stage stands out. Your numbers are fairly balanced, so the gains are in the pillars above.",
  };
  const FUNNEL_LEAK_NAME = {
    start: "starting conversations",
    convert: "conversation to first date",
    followup: "first date to second date",
    volume: "volume",
    none: "no clear leak",
  };

  function computeFunnel() {
    const c = answerLevel("f_conv");
    const d = answerLevel("f_date");
    const s = answerLevel("f_second");
    let leak = "none";
    if (c === 0) leak = "start";
    else if (d === 0 || d < c - 1) leak = "convert";
    else if (s === 0 || s < d - 1) leak = "followup";
    else if (c <= 1) leak = "volume";
    return {
      leak,
      c,
      d,
      s,
      convLabel: answer("f_conv"),
      dateLabel: answer("f_date"),
      secondLabel: answer("f_second"),
    };
  }

  function activeDeepDive() {
    const step = dataSteps.find((s) => s.dataset.deepdive);
    if (!step) return { pillar: "", items: [] };
    const items = Array.from(step.querySelectorAll(".form-field")).map((field) => {
      const checked = field.querySelector('input[type="radio"]:checked');
      return { short: field.dataset.short || "", answer: checked ? checked.value : "" };
    });
    return { pillar: step.dataset.deepdive, items };
  }

  function pickFastestWin(pillarScores) {
    const below = (limit) => WIN_ORDER.filter((p) => pillarScores[p] <= limit);
    const candidates = below(2).length ? below(2) : below(3);
    return candidates.length ? candidates[0] : null;
  }

  function groupPct(list, pillarScores) {
    const avg = list.reduce((sum, p) => sum + pillarScores[p], 0) / list.length;
    return { avg, pct: Math.round(((avg - 1) / 3) * 100) };
  }

  function computeInsights(result) {
    const { pillarScores, overall, bottleneck } = result;
    const funnel = computeFunnel();
    const deep = activeDeepDive();
    const considered = groupPct(CONSIDERED, pillarScores);
    const chosen = groupPct(CHOSEN, pillarScores);
    const gap = considered.avg - chosen.avg;
    let chosenText;
    if (gap <= -0.5) {
      chosenText = "You are being filtered out early. Women are not yet giving you the chance to show who you are, so your strengths in conversation and dating never get seen.";
    } else if (gap >= 0.5) {
      chosenText = "You get noticed. The gap is after the first hello, where conversations and dates are not yet turning into her choosing you.";
    } else {
      chosenText = "Getting noticed and getting chosen are about level for you, so the gains come from lifting your lowest pillar rather than fixing one stage.";
    }

    const win = pickFastestWin(pillarScores);

    const story = {
      years: answer("s_years"),
      tried: answer("s_tried"),
      cause: answer("s_cause"),
      goal: answer("g_goal"),
      impact: answer("g_impact"),
      hours: answer("k_hours"),
      beta: answer("k_beta"),
    };

    // Gentle notes where self reported answers do not line up. Worded as
    // things worth looking at together, never as accusations.
    const patterns = [];
    if (overall >= 65 && (funnel.c <= 1 || funnel.d === 0)) {
      patterns.push("You rated yourself strongly, but your last 90 days do not show it yet. Either a skill is not turning into action, or a rating is a little generous. Both are worth a look.");
    }
    const causePillars = CAUSE_PILLARS[story.cause];
    if (causePillars && !causePillars.includes(bottleneck) && pillarScores[bottleneck] < 4) {
      patterns.push(`You said the main thing holding you back is "${story.cause.toLowerCase()}". Your answers point at ${bottleneck} instead. Neither is wrong, but it is worth checking which one is really driving results.`);
    }
    if (answer("timeline") === "Right now, I'm done waiting" && story.hours === "1 to 2") {
      patterns.push("You said you are done waiting, and you can offer about 1 to 2 hours a week. Results in 90 days come from the hours you can protect, so it is worth planning around that.");
    }

    return { funnel, deep, considered, chosen, chosenText, win, story, patterns: patterns.slice(0, 2) };
  }

  // Plain text summary for Dan, sent to the Sheet and to Telegram. Rule
  // based, no AI. Free text is quoted as written.
  function buildBrief(ctx, result, ins) {
    const { pillarScores, overall, bottleneck } = result;
    const { funnel, deep, story } = ins;
    const lines = [];
    lines.push(`Profile: ${ctx.age}, ${ctx.industry}`);
    lines.push(`Wants: ${story.goal}. Impact on life: ${story.impact}.`);
    lines.push(`Struggling: ${story.years}. Tried most: ${story.tried}. Thinks it is: ${story.cause}.`);
    lines.push(`Last 90 days: conversations ${funnel.convLabel}, first dates ${funnel.dateLabel}, second dates ${funnel.secondLabel}. Leak: ${FUNNEL_LEAK_NAME[funnel.leak]}.`);
    lines.push(`Time: ${story.hours} hours a week. Free deal: ${story.beta}.`);
    if (deep.pillar) {
      lines.push(`Deep dive (${deep.pillar}, scored ${pillarScores[deep.pillar]}/4):`);
      deep.items.forEach((item) => lines.push(`• ${item.short}: ${item.answer}`));
    }
    if (ins.win) lines.push(`Fastest win shown: ${ins.win}.`);
    ins.patterns.forEach((p) => lines.push(`Pattern: ${p}`));
    if (ctx.words) lines.push(`In their words: "${ctx.words}"`);
    lines.push(`Suggested opening: ${OPENING[bottleneck]}${ctx.words ? " Acknowledge what they wrote first." : ""}`);
    return lines.join("\n");
  }

  // ---------- results rendering ----------
  function makeEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function barRow(label, pct, valueText, detailText, highlight) {
    const row = makeEl("div", "scorecard-bar-row" + (highlight ? " is-bottleneck" : ""));
    row.append(makeEl("span", "scorecard-bar-label", label));
    const track = makeEl("span", "scorecard-bar-track");
    const fill = makeEl("span", "scorecard-bar-fill");
    fill.style.width = `${pct}%`;
    track.append(fill);
    row.append(track, makeEl("span", "scorecard-bar-value", valueText));
    if (detailText) row.append(makeEl("span", "scorecard-bar-detail", detailText));
    return row;
  }

  function showScorecardResults(result, ctx, ins) {
    const resultsEl = document.getElementById("scorecardResults");
    const { pillarScores, overall, bottleneck } = result;
    const byId = (id) => document.getElementById(id);

    form.hidden = true;
    wrapper.querySelector(".form-progress").hidden = true;
    resultsEl.hidden = false;

    byId("scorecardOverallScore").textContent = overall;

    const callout = byId("scorecardBottleneckText");
    callout.textContent = "";
    if (pillarScores[bottleneck] >= 4) {
      callout.textContent = "You scored strong across all seven pillars. The call is where we look for the remaining gains.";
    } else {
      callout.append("Your biggest bottleneck right now: ");
      const strong = document.createElement("strong");
      strong.textContent = bottleneck;
      callout.append(strong, `. ${BOTTLENECK_COPY[bottleneck]}`);
    }

    const barList = byId("scorecardBarList");
    barList.textContent = "";
    Object.entries(pillarScores).forEach(([pillar, score]) => {
      const insight = PILLAR_INSIGHT[pillar][score <= 2 ? "low" : "high"];
      barList.append(
        barRow(pillar, (score / 4) * 100, `${score}/4`, `${LEVEL_LABEL[score]}. ${insight}`, pillar === bottleneck && score < 4)
      );
    });

    // Considered vs chosen
    const chosenBars = byId("scorecardChosenBars");
    chosenBars.textContent = "";
    chosenBars.append(
      barRow("Considered", ins.considered.pct, `${ins.considered.pct}%`, "Appearance, Taste, Temperament"),
      barRow("Chosen", ins.chosen.pct, `${ins.chosen.pct}%`, "Rapport, Attraction, Courtship")
    );
    byId("scorecardChosenText").textContent = ins.chosenText;

    // Fastest win
    const winText = byId("scorecardWinText");
    const winAction = byId("scorecardWinAction");
    winAction.textContent = "";
    if (ins.win) {
      winText.textContent = `${ins.win} is where a small change moves your results soonest.`;
      winAction.append(makeEl("strong", "", "Do this week: "), document.createTextNode(WIN_ACTION[ins.win]));
    } else {
      winText.textContent = "You scored strong everywhere, so there is no quick fix to hand you. The call is where we find the remaining gains.";
    }

    // Funnel
    const funnelTrack = byId("scorecardFunnelTrack");
    funnelTrack.textContent = "";
    const stages = [
      ["Conversations", ins.funnel.convLabel, ins.funnel.leak === "start"],
      ["First dates", ins.funnel.dateLabel, ins.funnel.leak === "convert"],
      ["Second dates", ins.funnel.secondLabel, ins.funnel.leak === "followup"],
    ];
    stages.forEach(([title, value, leak], i) => {
      if (i > 0) {
        const arrow = makeEl("span", "funnel-arrow", "›");
        arrow.setAttribute("aria-hidden", "true");
        funnelTrack.append(arrow);
      }
      const chip = makeEl("div", "funnel-stage" + (leak ? " is-leak" : ""));
      chip.append(makeEl("span", "funnel-stage-title", title), makeEl("span", "funnel-stage-value", value));
      funnelTrack.append(chip);
    });
    byId("scorecardFunnelText").textContent = FUNNEL_COPY[ins.funnel.leak];

    // Patterns
    const patternPanel = byId("scorecardPatternPanel");
    const patternList = byId("scorecardPatternList");
    patternList.textContent = "";
    ins.patterns.forEach((text) => patternList.append(makeEl("p", "scorecard-panel-text", text)));
    patternPanel.hidden = ins.patterns.length === 0;

    const note = byId("scorecardResultsNote");
    const ctaBtn = byId("scorecardCtaBtn");
    const ctaNote = byId("scorecardCtaNote");

    if (ctx.isQualified) {
      note.textContent = "This score is a starting point, not a diagnosis. On the call we go through your results and build a 90 day plan around your biggest bottleneck.";
      ctaBtn.textContent = "Book My Free Call";
      ctaNote.textContent = "Free, no obligation 45 minute call.";
    } else {
      note.textContent = "This score is a starting point, not a diagnosis. Based on your answers, a strategy call is not the right next step for you right now.";
      ctaBtn.textContent = "Continue";
      ctaNote.textContent = "";
    }

    ctaBtn.onclick = () => {
      track("scorecard_cta_click", { qualified: ctx.isQualified });
      if (ctx.isQualified) {
        // Qualified: straight to booking, contact details carried along so
        // Calendly can be prefilled (same as the old application form did).
        const params = new URLSearchParams({
          name: ctx.name,
          email: ctx.email,
          phone: ctx.phone,
          score: overall,
          bottleneck,
        });
        window.location.href = `${bookingUrl}?${params.toString()}`;
      } else {
        window.location.href = `${thankYouUrl}?${new URLSearchParams({ name: ctx.name }).toString()}`;
      }
    };

    track("scorecard_results_view", {
      overall_score: overall,
      bottleneck,
      qualified: ctx.isQualified,
      funnel_leak: ins.funnel.leak,
    });

    if (formAnchor) formAnchor.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Pressing Enter in a text field triggers a native form submit
    // even when an earlier step is showing. Treat that the same as
    // clicking Next unless we're actually on the last step.
    if (currentIndex < totalSteps - 1) {
      goNext();
      return;
    }

    if (!validateCurrentStep()) return;

    const dialCode = document.getElementById("phoneCountryBtn")?.dataset.dialCode || "";
    const phoneDigits = form.querySelector("#q7")?.value || "";
    const phone = phoneDigits ? `${dialCode} ${phoneDigits}` : "";
    const name = form.querySelector("#q1")?.value || "";
    const email = form.querySelector("#q2")?.value || "";
    const words = (form.querySelector("#q_words")?.value || "").trim().slice(0, 500);

    const industryAnswer = answer("industry");
    const timelineAnswer = answer("timeline");
    const ageAnswer = answer("age");

    // Leads who aren't students/early career AND have real urgency
    // (want change now or within a month) are routed to booking. Everyone
    // else still gets scored and logged for manual follow up, but is sent
    // to the thank-you page instead of the booking page.
    const DISQUALIFYING_INDUSTRY = "Student / early career";
    const DISQUALIFYING_TIMELINES = ["In the next few months", "Just exploring for now, no rush"];
    const isQualified =
      industryAnswer !== DISQUALIFYING_INDUSTRY && !DISQUALIFYING_TIMELINES.includes(timelineAnswer);

    const result = computeScorecard();
    const { pillarScores, overall, bottleneck } = result;
    const ins = computeInsights(result);
    const brief = buildBrief({ age: ageAnswer, industry: industryAnswer, words }, result, ins);

    // Log the lead (contact info, scorecard result, every answer, the lead
    // brief and the qualification outcome) to the Google Sheet and Telegram
    // via the Apps Script webhook. sendBeacon is used because it survives
    // page navigation and never blocks waiting on a response.
    if (SHEET_WEBHOOK_URL) {
      // Sheets misreads a leading "+" as the start of a formula, so the
      // dial code's "+" is swapped for the international "00" prefix
      // here only. The Calendly redirect keeps the real "+".
      const sheetPhone = phone.replace(/^\+/, "00");

      const sheetData = new URLSearchParams({
        source: "scorecard",
        name,
        email,
        phone: sheetPhone,
        // The real "+" prefixed number, kept separate from the sheet-safe
        // one above so the Telegram notification can show a number
        // Telegram recognizes as tappable to call.
        phoneReal: phone,
        overall: String(overall),
        bottleneck,
        timeline: timelineAnswer,
        age: ageAnswer,
        industry: industryAnswer,
        qualified: isQualified ? "Yes" : "No",
        funnelConv: ins.funnel.convLabel,
        funnelDates: ins.funnel.dateLabel,
        funnelSecond: ins.funnel.secondLabel,
        funnelLeak: FUNNEL_LEAK_NAME[ins.funnel.leak],
        years: ins.story.years,
        tried: ins.story.tried,
        cause: ins.story.cause,
        goal: ins.story.goal,
        impact: ins.story.impact,
        hours: ins.story.hours,
        beta: ins.story.beta,
        ddPillar: ins.deep.pillar,
        dd1: ins.deep.items[0] ? `${ins.deep.items[0].short}: ${ins.deep.items[0].answer}` : "",
        dd2: ins.deep.items[1] ? `${ins.deep.items[1].short}: ${ins.deep.items[1].answer}` : "",
        dd3: ins.deep.items[2] ? `${ins.deep.items[2].short}: ${ins.deep.items[2].answer}` : "",
        words,
        fastestWin: ins.win || "",
        brief,
      });
      Object.entries(pillarScores).forEach(([pillar, score]) => {
        sheetData.set(pillar.toLowerCase(), String(score));
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(SHEET_WEBHOOK_URL, sheetData);
      } else {
        fetch(SHEET_WEBHOOK_URL, { method: "POST", body: sheetData, keepalive: true }).catch(() => {});
      }
    }

    submitBtn.disabled = true;

    // Distinguishes a full completion from a step by step drop off, and
    // separately whether it converted to a booked call.
    track("form_submitted", { qualified: isQualified });

    showScorecardResults(result, { name, email, phone, isQualified }, ins);
  });

  // On mobile, opening the on-screen keyboard shrinks the visible
  // (visual) viewport without changing the page's layout — the OS then
  // scrolls to keep the focused field in view, but often leaves it
  // pinned at the very top edge of that shrunk area with the rest of
  // the form barely visible. Only fields that actually open a keyboard
  // need this: re-centering on radio steps fights the user's own
  // scroll, since the visualViewport also resizes for unrelated reasons
  // (Safari's toolbar collapsing while scrolling, for one). And rather
  // than centering on the input itself — which can push earlier
  // questions in the same step off-screen — anchor on the "Ready to
  // get started" label above the form, so the whole step (progress
  // bar, title, and every question in it) stays visible together.
  if (window.visualViewport && formAnchor) {
    window.visualViewport.addEventListener("resize", () => {
      const active = document.activeElement;
      if (!active || !form.contains(active) || !opensKeyboard(active)) return;
      formAnchor.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  showStep(currentIndex);
})();
