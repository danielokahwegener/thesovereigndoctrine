// ---------------------------------------------------------
// Personalize the headline with the name passed from the
// application form, if available.
// ---------------------------------------------------------
(function personalizeThankYou() {
  const headline = document.getElementById("thankYouHeadline");
  if (!headline) return;

  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) headline.textContent = `Thanks, ${name}!`;
})();
