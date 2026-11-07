// ---------------------------------------------------------
// Personalize the confirmation headline with the name passed
// from the booking page, if available.
// ---------------------------------------------------------
(function personalizeConfirmation() {
  const headline = document.getElementById("confirmationHeadline");
  if (!headline) return;

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) headline.textContent = `You're All Set, ${name}`;
})();

// ---------------------------------------------------------
// Fire a "booked a call" conversion event. This page only
// loads after a successful Calendly booking, so this is the
// right place for it. Uncomment whichever pixels are live on
// the site (their base/init snippet must already be loaded
// site-wide — see the comment in confirmation.html).
// ---------------------------------------------------------
(function trackBookingConversion() {
  // Meta (Facebook) Pixel
  // if (typeof fbq === "function") fbq("track", "Schedule");

  // Google Ads conversion
  // if (typeof gtag === "function") {
  //   gtag("event", "conversion", {
  //     send_to: "AW-XXXXXXXXX/XXXXXXXXXXXXXXXXXXXX",
  //   });
  // }

  // Google Analytics 4
  // if (typeof gtag === "function") gtag("event", "schedule_appointment");

  // TikTok Pixel
  // if (typeof ttq === "object") ttq.track("Schedule");
})();
