// ---------------------------------------------------------
// Attraction Scorecard quiz
// ---------------------------------------------------------
// Self-contained on purpose — does not touch main.js or its
// SHEET_WEBHOOK_URL, so nothing about the existing application form
// / booking flow can break by editing this file. If you want quiz
// results logged to the same Google Sheet as the application form,
// copy the real webhook URL from js/main.js into SHEET_WEBHOOK_URL
// below, AND confirm with whoever maintains the Apps Script that it
// writes new incoming fields (pillar scores, bottleneck, overallScore)
// to new columns rather than silently dropping anything it doesn't
// already have a header for. Left blank for now so nothing fires
// until that's confirmed.
const SHEET_WEBHOOK_URL = "";

(function attractionScorecard() {
  const wrapper = document.getElementById("scorecardForm");
  if (!wrapper) return;

  const form = document.getElementById("scorecardQuizForm");
  const resultsEl = document.getElementById("scorecardResults");
  const dataSteps = Array.from(wrapper.querySelectorAll(".form-step[data-step]"));
  const totalSteps = dataSteps.length;
  const bookingUrl = wrapper.dataset.bookingUrl || "booking.html";

  const progressWrap = document.getElementById("scorecardProgressWrap");
  const progressFill = document.getElementById("scorecardProgressFill");
  const stepLabel = document.getElementById("scorecardStepLabel");
  const backBtn = document.getElementById("scorecardBack");
  const nextBtn = document.getElementById("scorecardNext");

  let currentIndex = 0;
  let autoAdvanceTimer = null;

  function showStep(index) {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    dataSteps.forEach((step, i) => step.classList.toggle("is-active", i === index));

    const progressPct = ((index + 1) / totalSteps) * 100;
    progressFill.style.width = progressPct + "%";
    stepLabel.textContent = `Question ${index + 1} of ${totalSteps}`;
    backBtn.classList.toggle("is-visible", index > 0);

    wrapper.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function currentStepRadios() {
    return Array.from(dataSteps[currentIndex].querySelectorAll('input[type="radio"]'));
  }

  function currentStepAnswered() {
    return currentStepRadios().some((r) => r.checked);
  }

  function goNext() {
    if (!currentStepAnswered()) return;
    if (currentIndex < totalSteps - 1) {
      currentIndex += 1;
      showStep(currentIndex);
    } else {
      showResults();
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      currentIndex -= 1;
      showStep(currentIndex);
    }
  }

  nextBtn.addEventListener("click", goNext);
  backBtn.addEventListener("click", goBack);

  // Every question here is radio-only (no typing), so auto-advance
  // the same way the main application form does — picking an answer
  // is the intent to move on, waiting for an extra tap just adds
  // friction to a quiz that's supposed to feel fast.
  form.addEventListener("change", (e) => {
    if (e.target.type !== "radio") return;
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(goNext, 350);
  });

  // ---------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------
  // Each question is answered 1-4. 7 questions, so raw total
  // ranges 7-28. Mapped to a 0-100 "Attraction Score" for the
  // results screen: (total - 7) / 21 * 100.
  function computeResults() {
    const pillarScores = {};
    dataSteps.forEach((step) => {
      const pillar = step.dataset.pillar;
      const checked = step.querySelector('input[type="radio"]:checked');
      pillarScores[pillar] = checked ? Number(checked.value) : 0;
    });

    const rawTotal = Object.values(pillarScores).reduce((sum, v) => sum + v, 0);
    const overallScore = Math.round(((rawTotal - totalSteps) / (totalSteps * 3)) * 100);

    // Lowest-scoring pillar is the bottleneck. Ties keep the one that
    // appears first in ATTRACT order (Appearance decides "considered"
    // before anything else matters, per the Framework's own logic).
    let bottleneckPillar = dataSteps[0].dataset.pillar;
    let lowest = pillarScores[bottleneckPillar];
    dataSteps.forEach((step) => {
      const pillar = step.dataset.pillar;
      if (pillarScores[pillar] < lowest) {
        lowest = pillarScores[pillar];
        bottleneckPillar = pillar;
      }
    });

    return { pillarScores, overallScore, bottleneckPillar };
  }

  // One line of context per pillar for the bottleneck callout — keep
  // these short, the real explanation happens on the call, this just
  // needs to make the result feel specific rather than generic.
  const BOTTLENECK_COPY = {
    Appearance: "Appearance decides whether you get considered at all before anything else matters. This is usually the highest-leverage place to start.",
    Taste: "Wardrobe and style are often the fastest pillar to fix, and they're compounding against everything else right now.",
    Temperament: "This is the pillar that undercuts everything downstream — you can look the part and still lose ground here.",
    Rapport: "You're probably getting considered, the gap is in converting that into real connection.",
    Attraction: "Your profile and presence aren't currently doing justice to where you're actually at.",
    Courtship: "You're getting attention, the gap is in turning that into dates that actually go somewhere.",
    Traction: "You've likely identified the right things to fix before, the missing piece is a structure that actually holds you to it.",
  };

  function showResults() {
    const { pillarScores, overallScore, bottleneckPillar } = computeResults();

    form.hidden = true;
    progressWrap.hidden = true;
    document.querySelector(".form-nav").hidden = true;
    resultsEl.hidden = false;

    document.getElementById("scorecardOverallScore").textContent = overallScore;
    document.getElementById("scorecardBottleneckText").innerHTML =
      `Your biggest bottleneck right now: <strong>${bottleneckPillar}</strong>. ${BOTTLENECK_COPY[bottleneckPillar]}`;

    const barList = document.getElementById("scorecardBarList");
    barList.innerHTML = "";
    Object.entries(pillarScores).forEach(([pillar, score]) => {
      const pct = (score / 4) * 100;
      const row = document.createElement("div");
      row.className = "scorecard-bar-row" + (pillar === bottleneckPillar ? " is-bottleneck" : "");
      row.innerHTML = `
        <span class="scorecard-bar-label">${pillar}</span>
        <span class="scorecard-bar-track"><span class="scorecard-bar-fill" style="width:${pct}%"></span></span>
      `;
      barList.appendChild(row);
    });

    resultsEl.scrollIntoView({ block: "start", behavior: "smooth" });

    // Store for the booking button handler below.
    resultsEl.dataset.overallScore = overallScore;
    resultsEl.dataset.bottleneckPillar = bottleneckPillar;
  }

  // ---------------------------------------------------------
  // Book button — logs the result (if a webhook is configured
  // above) then sends the visitor to booking.html with their info
  // prefilled, same pattern the main application form uses for
  // Calendly.
  // ---------------------------------------------------------
  document.getElementById("scorecardBookBtn").addEventListener("click", () => {
    const name = document.getElementById("scorecardName").value.trim();
    const email = document.getElementById("scorecardEmail").value.trim();

    if (!name || !email) {
      document.getElementById("scorecardName").reportValidity();
      document.getElementById("scorecardEmail").reportValidity();
      return;
    }

    if (SHEET_WEBHOOK_URL) {
      const data = new URLSearchParams({
        name,
        email,
        overallScore: resultsEl.dataset.overallScore,
        bottleneckPillar: resultsEl.dataset.bottleneckPillar,
        source: "scorecard-quiz",
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(SHEET_WEBHOOK_URL, data);
      } else {
        fetch(SHEET_WEBHOOK_URL, { method: "POST", body: data, keepalive: true }).catch(() => {});
      }
    }

    const params = new URLSearchParams({
      name,
      email,
      overallScore: resultsEl.dataset.overallScore,
      bottleneckPillar: resultsEl.dataset.bottleneckPillar,
    });
    window.location.href = `${bookingUrl}?${params.toString()}`;
  });

  showStep(currentIndex);
})();
