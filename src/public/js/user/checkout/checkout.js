// Utility: show the requested page (1..4) and update stepper visuals
function nextPage(pageNumber) {
  if (!pageNumber || pageNumber < 1) pageNumber = 1;
  const pages = document.querySelectorAll(".page");
  pages.forEach((p) => (p.style.display = "none"));

  const show = document.getElementById("page" + pageNumber);
  if (!show) return console.warn("page not found: ", pageNumber);
  show.style.display = "block";

  // update all steppers inside the shown page (there's one per page)
  const steppers = show.querySelectorAll("[data-stepper]");
  steppers.forEach((stepper) => {
    const steps = stepper.querySelectorAll(".step");
    steps.forEach((s) => s.classList.remove("active-step"));
    for (let i = 0; i < steps.length; i++) {
      const stepIndex = Number(steps[i].getAttribute("data-step")) || i + 1;
      if (stepIndex <= pageNumber) steps[i].classList.add("active-step");
    }
  });

  // Also update stepper visuals on *other* pages so if user navigates back, their steppers look correct.
  document.querySelectorAll(".stepper [data-step]").forEach((el) => {
    const stepIdx = Number(el.getAttribute("data-step")) || 0;
    if (stepIdx <= pageNumber) el.classList.add("active-step");
    else el.classList.remove("active-step");
  });

  // Scroll to top of container for better UX
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// confirmPurchase: validate UPI and proceed
function confirmPurchase() {
  try {
    const upiEl = document.getElementById("upiId");
    if (!upiEl) {
      console.error("UPI input not found in DOM");
      alert("UPI field is missing. Reload the page.");
      return;
    }
    const upi = upiEl.value.trim();
    // basic validation: must contain '@' and at least 3 characters before it
    const valid = /^[^@\s]{1,}@[^@\s]{1,}$/.test(upi);
    if (!valid) {
      alert("Please enter a valid UPI ID (e.g. username@bank)");
      upiEl.focus();
      return;
    }

    // simulate payment processing, then go to confirmation
    document.querySelectorAll(".btn").forEach((b) => (b.disabled = true));
    setTimeout(() => {
      document.querySelectorAll(".btn").forEach((b) => (b.disabled = false));
      nextPage(4);
    }, 700);
  } catch (err) {
    console.error(err);
    alert("An error occurred while processing payment.");
  }
}

function goHome() {
  alert("Returning to home (placeholder)");
  // location.href = '/'; // uncomment for real navigation
}

function downloadInvoice() {
  alert("Download invoice (placeholder)");
  // implement real invoice generation when needed
}

// initialize first page on DOM ready
document.addEventListener("DOMContentLoaded", () => nextPage(1));
