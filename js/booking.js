// ---------------------------------------------------------
// Initialize the Calendly inline widget, prefilled with the
// name/email/phone passed via URL from the application form.
// ---------------------------------------------------------
(function initCalendlyBooking() {
  const container = document.getElementById("calendly-embed");
  if (!container || !window.Calendly) return;

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "";
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";

  window.Calendly.initInlineWidget({
    url: "https://calendly.com/reprimeperformance/diagnostik",
    parentElement: container,
    prefill: {
      name: name,
      email: email,
      // Maps to the first custom question on the Calendly event.
      // Adjust (or remove) if the event doesn't have a matching question.
      customAnswers: phone ? { a1: phone } : {},
    },
  });

  // Calendly posts a message to the parent window once a booking is
  // actually confirmed. Send the visitor to the confirmation page from
  // there so it only loads after a real scheduling event (useful for
  // firing a conversion pixel on that page).
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://calendly.com") return;
    if (!event.data?.event || event.data.event !== "calendly.event_scheduled") return;

    // Ping the same Apps Script webhook the application form uses, so a
    // booked call also triggers an instant notification. SHEET_WEBHOOK_URL
    // is declared in main.js, loaded before this script on booking.html.
    if (typeof SHEET_WEBHOOK_URL !== "undefined" && SHEET_WEBHOOK_URL) {
      const bookingData = new URLSearchParams({ type: "booking", name, email, phone });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(SHEET_WEBHOOK_URL, bookingData);
      } else {
        fetch(SHEET_WEBHOOK_URL, { method: "POST", body: bookingData, keepalive: true }).catch(() => {});
      }
    }

    const confirmationParams = new URLSearchParams({ name, email });
    window.location.href = `confirmation.html?${confirmationParams.toString()}`;
  });
})();
