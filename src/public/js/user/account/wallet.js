/* -----------------------------
      STRIPE INITIALIZATION
   ----------------------------- */
const stripe = Stripe(
  "pk_test_51SprHJDaZqWZuwPQahtwI62z1s3n0NZ1RChPHKFRpiPwSZuuAmJmdSMqNL6oXTIPtJ7Ijc55sT5vc4MBCo0DRaV200Hmz5YVeg",
);
let elements;
let clientSecret;
let selectedAmount = 0;

/* -----------------------------
     SECTION MANAGEMENT
   ----------------------------- */
function showSection(sectionName) {
  const sections = document.querySelectorAll(".section");
  sections.forEach((s) => s.classList.remove("active"));

  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.classList.add("active");
  }
}

/* -----------------------------
     AMOUNT SELECTION
   ----------------------------- */
function setAmount(amount) {
  const amountInput = document.getElementById("amountInput");
  if (amountInput) {
    amountInput.value = amount;
  }
}

function validateAndContinue() {
  const amountInput = document.getElementById("amountInput");
  const amount = parseFloat(amountInput.value);

  if (!amount || amount < 1) {
    alert("Please enter a valid amount (minimum ₹1)");
    return;
  }

  selectedAmount = amount;
  const payAmountEl = document.getElementById("payAmount");
  if (payAmountEl) {
    payAmountEl.textContent = `₹${amount.toFixed(2)}`;
  }
  showSection("payment");
}

/* -----------------------------
     PROCESS PAYMENT
   ----------------------------- */
async function processPayment() {
  const payBtn = document.getElementById("payBtn");
  const payBtnText = document.getElementById("payBtnText");
  const payBtnSpinner = document.getElementById("payBtnSpinner");

  if (!payBtn) return;

  // Disable button and show loading
  payBtn.disabled = true;
  if (payBtnText) payBtnText.textContent = "Processing...";
  if (payBtnSpinner) payBtnSpinner.style.display = "inline-block";

  try {
    // Create payment intent
    const response = await fetch("/account/wallet/add-money", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: selectedAmount }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to initialize payment");
    }

    clientSecret = data.clientSecret;

    // Initialize Stripe Elements
    const appearance = {
      theme: "stripe",
      variables: {
        colorPrimary: "#000000",
      },
    };

    elements = stripe.elements({ clientSecret, appearance });
    const paymentElement = elements.create("payment");

    // Create and show payment modal
    createPaymentModal(paymentElement);
  } catch (error) {
    console.error("Payment initialization error:", error);
    alert(error.message || "Failed to initialize payment");

    // Re-enable button
    if (payBtn) payBtn.disabled = false;
    if (payBtnText) payBtnText.textContent = "Pay Now";
    if (payBtnSpinner) payBtnSpinner.style.display = "none";
  }
}

/* -----------------------------
     CREATE PAYMENT MODAL
   ----------------------------- */
function createPaymentModal(paymentElement) {
  // Remove existing modal if any
  const existingModal = document.getElementById("stripePaymentModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div id="stripePaymentModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h5 style="margin: 0; font-weight: bold;">Complete Payment</h5>
          <button onclick="closePaymentModal()" style="border: none; background: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
        </div>
        
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <small style="color: #666; display: block; margin-bottom: 4px;">Amount to Pay</small>
          <div style="font-size: 28px; font-weight: bold; color: #000;">₹${selectedAmount.toFixed(2)}</div>
        </div>
        
        <div id="stripe-payment-element" style="margin-bottom: 20px;"></div>
        
        <button id="stripeSubmitBtn" onclick="handleStripePayment()" style="width: 100%; padding: 14px; background: #000; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px;">
          <span id="stripeSubmitText">Pay ₹${selectedAmount.toFixed(2)}</span>
          <span id="stripeSubmitSpinner" class="spinner-border spinner-border-sm ms-2" style="display: none;"></span>
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Mount payment element
  setTimeout(() => {
    paymentElement.mount("#stripe-payment-element");
  }, 100);

  // Re-enable the pay button
  const payBtn = document.getElementById("payBtn");
  const payBtnText = document.getElementById("payBtnText");
  const payBtnSpinner = document.getElementById("payBtnSpinner");

  if (payBtn) payBtn.disabled = false;
  if (payBtnText) payBtnText.textContent = "Pay Now";
  if (payBtnSpinner) payBtnSpinner.style.display = "none";
}

function closePaymentModal() {
  const modal = document.getElementById("stripePaymentModal");
  if (modal) {
    modal.remove();
  }

  // Reset elements
  if (elements) {
    elements = null;
  }
}

/* -----------------------------
     HANDLE STRIPE PAYMENT
   ----------------------------- */
async function handleStripePayment() {
  const submitBtn = document.getElementById("stripeSubmitBtn");
  const submitText = document.getElementById("stripeSubmitText");
  const submitSpinner = document.getElementById("stripeSubmitSpinner");

  if (!submitBtn || !elements) return;

  submitBtn.disabled = true;
  if (submitText) submitText.textContent = "Processing...";
  if (submitSpinner) submitSpinner.style.display = "inline-block";

  try {
    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.origin + "/account/wallet",
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Update submit button
      if (submitText) submitText.textContent = "Verifying...";

      // Verify payment on backend
      const response = await fetch("/account/wallet/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_intent: paymentIntent.id }),
      });

      const data = await response.json();

      if (data.success) {
        closePaymentModal();
        showSection("success");

        // Update balance display if element exists
        const balanceEl = document.getElementById("balance");
        if (balanceEl) {
          balanceEl.textContent = `₹${data.balance.toFixed(2)}`;
        }
      } else {
        throw new Error(data.message || "Payment verification failed");
      }
    }
  } catch (error) {
    console.error("Payment error:", error);
    alert(error.message || "Payment failed. Please try again.");

    // Re-enable button
    if (submitBtn) submitBtn.disabled = false;
    if (submitText)
      submitText.textContent = `Pay ₹${selectedAmount.toFixed(2)}`;
    if (submitSpinner) submitSpinner.style.display = "none";
  }
}

/* -----------------------------
     INITIALIZE ON PAGE LOAD
   ----------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  console.log("Wallet page loaded");

  // Check for payment status in URL
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status");

  if (status === "success") {
    showSection("success");
  } else if (status === "cancel") {
    showSection("cancel");
  }
});
