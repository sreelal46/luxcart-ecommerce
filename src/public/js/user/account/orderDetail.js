"use strict";

/* -----------------------------
     GLOBAL STATE
  ----------------------------- */
let orderId = null;
let itemId = null;
let activeButton = null;
document.querySelectorAll(".progress-fill").forEach((bar) => {
  requestAnimationFrame(() => {
    bar.style.width = bar.classList.contains("delivered")
      ? "100%"
      : bar.classList.contains("out_for_delivery")
        ? "78%"
        : bar.classList.contains("shipped")
          ? "64%"
          : bar.classList.contains("confirmed")
            ? "40%"
            : "0%";
  });
});

/* -----------------------------
     MOBILE ALERT
  ----------------------------- */
function showMobileAlert(message, type) {
  const alertBox = document.getElementById("mobileAlert");
  if (!alertBox) return;

  const icons = {
    success: "bi-check-circle-fill success-icon",
    error: "bi-x-circle-fill error-icon",
    warning: "bi-exclamation-triangle-fill yellow-icon",
  };

  alertBox.innerHTML = `
    <i class="bi ${icons[type] || icons.success}"></i>
    <span>${message}</span>
  `;

  alertBox.classList.add("show");

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 2000);
}

/* -----------------------------
     SUCCESS MODAL
  ----------------------------- */
function showSuccessModal(msg) {
  const modalEl = document.getElementById("successModal");
  document.getElementById("responsMsg").textContent = msg;

  const modal = new bootstrap.Modal(modalEl, {
    backdrop: "static",
    keyboard: false,
  });

  modal.show();
  setTimeout(() => {
    modal.hide();
  }, 2000);

  modalEl.addEventListener(
    "hidden.bs.modal",
    () => {
      if (activeButton) {
        activeButton.focus();
      }
    },
    { once: true },
  );
}

/* -----------------------------
     FORM VALIDATION
  ----------------------------- */
function validateForm(form) {
  let valid = true;

  const subject = form.querySelector('input[name="subject"]');
  const message = form.querySelector('textarea[name="message"]');

  const subjectError = form.querySelector(".error-subject");
  const messageError = form.querySelector(".error-message");

  if (!subject.value.trim()) {
    subject.classList.add("is-invalid");
    subjectError.classList.remove("d-none");
    valid = false;
  } else {
    subject.classList.remove("is-invalid");
    subjectError.classList.add("d-none");
  }

  if (!message.value.trim()) {
    message.classList.add("is-invalid");
    messageError.classList.remove("d-none");
    valid = false;
  } else {
    message.classList.remove("is-invalid");
    messageError.classList.add("d-none");
  }

  return valid;
}

/* -----------------------------
     STRIPE INITIALIZATION
  ----------------------------- */
const stripe = Stripe(
  "pk_test_51SprHJDaZqWZuwPQahtwI62z1s3n0NZ1RChPHKFRpiPwSZuuAmJmdSMqNL6oXTIPtJ7Ijc55sT5vc4MBCo0DRaV200Hmz5YVeg",
);
let elements;
let clientSecret;
let currentOrderId;
let successRedirectUrl = null;

/* -----------------------------
     CHECK URL PARAMS FOR ERRORS
  ----------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");

  if (error) {
    const errorMessages = {
      amount_mismatch: "Payment amount does not match order total",
      payment_not_found: "Payment information not found",
      payment_failed: "Payment transaction failed",
      payment_canceled: "Payment was canceled",
      verification_failed: "Payment verification failed",
    };

    showErrorModal(
      "Payment Error",
      errorMessages[error] || "An error occurred during payment",
    );
  }
});

/* -----------------------------
     MODAL FUNCTIONS
  ----------------------------- */
function showSuccessModal(title, message, redirectUrl = null) {
  const modal = document.getElementById("paymentSuccessModal");
  const titleEl = document.getElementById("successTitle");
  const messageEl = document.getElementById("successMessage");

  titleEl.textContent = title;
  messageEl.textContent = message;
  successRedirectUrl = redirectUrl;

  modal.classList.add("show");
}

function showErrorModal(title, message) {
  const modal = document.getElementById("paymentErrorModal");
  const titleEl = document.getElementById("errorTitle");
  const messageEl = document.getElementById("errorMessage");

  titleEl.textContent = title;
  messageEl.textContent = message;

  modal.classList.add("show");
}

function closeSuccessModal() {
  const modal = document.getElementById("paymentSuccessModal");
  modal.classList.remove("show");

  if (successRedirectUrl) {
    window.location.href = successRedirectUrl;
  } else {
    window.location.reload();
  }
}

function closeErrorModal() {
  const modal = document.getElementById("paymentErrorModal");
  modal.classList.remove("show");
}

/* -----------------------------
     STRIPE PAYMENT FUNCTION
  ----------------------------- */
async function payment(div) {
  try {
    // Get data from button attributes
    const paymentMethod = div.getAttribute("data-payment");
    const totalAmount = div.getAttribute("data-totalamount");
    const orderId = div.getAttribute("data-orderid");

    console.log("Payment initiated:", { paymentMethod, totalAmount, orderId });

    // Validation
    if (!paymentMethod) {
      showErrorModal("Payment Error", "Payment method not specified");
      return;
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      showErrorModal("Payment Error", "Invalid payment amount");
      return;
    }

    if (!orderId) {
      showErrorModal("Payment Error", "Order ID not found");
      return;
    }

    // Disable button during processing
    div.disabled = true;
    const originalHTML = div.innerHTML;
    div.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading...';

    console.log("Sending payment request...");
    const res = await axios.patch(`/order/full-payment/${paymentMethod}`, {
      amount: parseFloat(totalAmount),
      orderId: orderId,
    });

    console.log("Payment response:", res.data);

    if (res.data.success) {
      clientSecret = res.data.clientSecret;
      currentOrderId = orderId;

      // Initialize Stripe Elements
      elements = stripe.elements({ clientSecret });
      const paymentElement = elements.create("payment");

      const container = document.getElementById("payment-element");
      const stripeBox = document.getElementById("stripe-box");
      const amountDisplay = document.getElementById("stripe-amount");

      // Format amount for display
      const formattedAmount = `₹${parseFloat(totalAmount).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`;

      amountDisplay.textContent = formattedAmount;
      stripeBox.style.display = "block";
      container.innerHTML = "";

      // Mount payment element with error handling
      try {
        await paymentElement.mount(container);
        console.log("Payment element mounted successfully");
      } catch (mountError) {
        console.error("Payment element mount error:", mountError);
        showErrorModal(
          "Payment Setup Error",
          "Unable to load payment form. Please refresh and try again.",
        );
        div.disabled = false;
        div.innerHTML = originalHTML;
        return;
      }

      // Update submit button
      const btnAmount = document.getElementById("btn-amount");
      btnAmount.textContent = formattedAmount;

      const submitBtn = document.getElementById("stripe-submit-btn");
      submitBtn.onclick = () => handleStripePayment(orderId);

      // Re-enable the original button
      div.disabled = false;
      div.innerHTML = originalHTML;

      // Scroll to payment form
      stripeBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      div.disabled = false;
      div.innerHTML = originalHTML;
      showErrorModal(
        "Payment Initialization Failed",
        res.data.message || "Unable to initialize payment. Please try again.",
      );
    }
  } catch (err) {
    console.error("Payment init error:", err);

    // Re-enable button
    if (div) {
      div.disabled = false;
      div.innerHTML =
        div.getAttribute("data-original-html") ||
        '<i class="bi bi-credit-card"></i> Pay Now';
    }

    // Handle different error types
    let errorMessage = "Failed to initialize payment. Please try again.";

    if (err.response) {
      console.error("Response error:", err.response.data);
      errorMessage =
        err.response.data?.message || err.response.data?.error || errorMessage;
    } else if (err.request) {
      console.error("Request error:", err.request);
      errorMessage =
        "Network error. Please check your connection and try again.";
    } else {
      console.error("Error:", err.message);
      errorMessage = err.message || errorMessage;
    }

    showErrorModal("Payment Error", errorMessage);
  }
}

/* -----------------------------
     HANDLE STRIPE PAYMENT
  ----------------------------- */
async function handleStripePayment(orderId) {
  const submitBtn = document.getElementById("stripe-submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnAmount = document.getElementById("btn-amount");

  submitBtn.disabled = true;
  btnText.textContent = "Processing...";
  btnAmount.style.display = "none";

  try {
    console.log("Confirming payment...");
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      console.error("Payment confirmation error:", error);
      showErrorModal("Payment Failed", error.message);
      submitBtn.disabled = false;
      btnText.textContent = "Pay Now";
      btnAmount.style.display = "inline";
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      console.log("Payment succeeded:", paymentIntent.id);
      btnText.textContent = "Completing payment...";

      // Update order status on backend
      const response = await axios.patch(
        `/order/full-payment/change-status/${orderId}`,
        {
          payment_intent: paymentIntent.id,
        },
      );

      console.log("Status update response:", response.data);

      if (response.data.success) {
        showSuccessModal(
          "Payment Successful!",
          "Your payment has been processed successfully. Redirecting...",
          response.data.redirect || window.location.href,
        );
      } else {
        showErrorModal(
          "Order Update Failed",
          response.data.message ||
            "Payment succeeded but order update failed. Please contact support.",
        );
        submitBtn.disabled = false;
        btnText.textContent = "Pay Now";
        btnAmount.style.display = "inline";
      }
    }
  } catch (err) {
    console.error("Payment error:", err);

    let errorMessage =
      "An error occurred while processing your payment. Please try again.";
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }

    showErrorModal("Payment Processing Error", errorMessage);
    submitBtn.disabled = false;
    btnText.textContent = "Pay Now";
    btnAmount.style.display = "inline";
  }
}

/* -----------------------------
     DOM READY
  ----------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* =============================
       INVOICE DOWNLOAD
   ============================= */

  const downloadInvoice = document.getElementById("downloadInvoice");

  if (downloadInvoice) {
    const btnText = downloadInvoice.querySelector(".btn-text");
    const btnLoader = downloadInvoice.querySelector(".btn-loader");

    downloadInvoice.addEventListener("click", async () => {
      const orderId = downloadInvoice.dataset.orderid;
      const orderedId = downloadInvoice.dataset.orderedid;
      const customerName = downloadInvoice.dataset.customername;

      // 🔄 Show loader
      downloadInvoice.disabled = true;
      btnText.classList.add("d-none");
      btnLoader.classList.remove("d-none");

      try {
        const res = await axios.get(
          `/cart/checkout-success/download-invoice/${orderId}`,
          { responseType: "blob" },
        );

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const safeName =
          customerName?.replace(/[^a-zA-Z0-9]/g, "_") || "Customer";

        const a = document.createElement("a");
        a.href = url;
        a.download = `LUXCART-Invoice-${safeName}-${orderedId}.pdf`;
        document.body.appendChild(a);
        a.click();

        a.remove();
        URL.revokeObjectURL(url);

        showMobileAlert("Invoice downloaded", "success");
      } catch (err) {
        showMobileAlert("Invoice download failed", "error");
      } finally {
        // ✅ Restore button
        downloadInvoice.disabled = false;
        btnLoader.classList.add("d-none");
        btnText.classList.remove("d-none");
      }
    });
  }

  /* =============================
       CAPTURE CANCEL / RETURN BUTTON
    ============================= */
  document.querySelectorAll(".item-action-btn.cancel").forEach((btn) => {
    btn.addEventListener("click", () => {
      orderId = btn.dataset.orderid;
      itemId = btn.dataset.itemid;
      activeButton = btn;

      console.log("CANCEL CLICKED:", orderId, itemId);
    });
  });

  document.querySelectorAll(".item-action-btn.return").forEach((btn) => {
    btn.addEventListener("click", () => {
      orderId = btn.dataset.orderid;
      itemId = btn.dataset.itemid;
      activeButton = btn;

      console.log("RETURN CLICKED:", orderId, itemId);
    });
  });

  /* =============================
       CANCEL FORM SUBMIT
    ============================= */
  document
    .getElementById("cancelForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!validateForm(this)) return;

      if (!orderId || !itemId) {
        showMobileAlert("Invalid item selected", "error");
        return;
      }

      const data = Object.fromEntries(new FormData(this).entries());

      try {
        const res = await axios.post(
          `/account/orders/order-details/cancel-request/${orderId}/${itemId}`,
          data,
        );

        if (res.data.success) {
          bootstrap.Modal.getInstance(
            document.getElementById("cancelModal"),
          ).hide();
          this.reset();
          showSuccessModal("Cancel request sent");

          // UI UPDATE
          activeButton.textContent = "Cancel Requested";
          activeButton.disabled = true;
          activeButton.style.pointerEvents = "none";
        }
      } catch (err) {
        showSuccessModal("Cancel request failed");
      }
    });

  /* =============================
       RETURN FORM SUBMIT
    ============================= */
  document
    .getElementById("returnForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!validateForm(this)) return;

      if (!orderId || !itemId) {
        showMobileAlert("Invalid item selected", "error");
        return;
      }

      const data = Object.fromEntries(new FormData(this).entries());

      try {
        const res = await axios.post(
          `/account/orders/order-details/return-request/${orderId}/${itemId}`,
          data,
        );

        if (res.data.success) {
          bootstrap.Modal.getInstance(
            document.getElementById("returnModal"),
          ).hide();
          this.reset();
          showSuccessModal("Return request sent");

          // UI UPDATE
          activeButton.textContent = "Return Requested";
          activeButton.disabled = true;
          activeButton.style.pointerEvents = "none";
        }
      } catch (err) {
        showSuccessModal("Return request failed");
      }
    });
});
