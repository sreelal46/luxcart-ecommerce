const stripe = Stripe(
  "pk_test_51SprHJDaZqWZuwPQahtwI62z1s3n0NZ1RChPHKFRpiPwSZuuAmJmdSMqNL6oXTIPtJ7Ijc55sT5vc4MBCo0DRaV200Hmz5YVeg",
);
let elements;
let clientSecret;
let currentCartId;
let successRedirectUrl = null;

/* --------------------------------------------------------
     URL error-param check on load
     -------------------------------------------------------- */
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

/* --------------------------------------------------------
     Success / Error modal helpers
     -------------------------------------------------------- */
function showSuccessModal(title, message, redirectUrl = null) {
  document.getElementById("successTitle").textContent = title;
  document.getElementById("successMessage").textContent = message;
  successRedirectUrl = redirectUrl;
  document.getElementById("successModal").classList.add("show");
}

function showErrorModal(title, message) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorModal").classList.add("show");
}

function closeSuccessModal() {
  document.getElementById("successModal").classList.remove("show");
  if (successRedirectUrl) window.location.href = successRedirectUrl;
}

function closeErrorModal() {
  document.getElementById("errorModal").classList.remove("show");
}

/* --------------------------------------------------------
     Reset/Hide Stripe payment form
     -------------------------------------------------------- */
function hideStripePayment() {
  const stripeBox = document.getElementById("stripe-box");
  const container = document.getElementById("payment-element");

  if (elements) {
    // Unmount the payment element if it exists
    try {
      const paymentElement = elements.getElement("payment");
      if (paymentElement) {
        paymentElement.unmount();
      }
    } catch (e) {
      console.log("Payment element already unmounted");
    }
  }

  stripeBox.style.display = "none";
  container.innerHTML = "";
  elements = null;
  clientSecret = null;
  currentCartId = null;
}

/* --------------------------------------------------------
     Stripe – init payment element
     -------------------------------------------------------- */
async function payment(div) {
  const paymentMethod = div.getAttribute("data-payment");
  const totalAmount = div.getAttribute("data-totalamount");
  const cartId = div.getAttribute("data-cartid");
  currentCartId = cartId;

  try {
    const res = await axios.post(`/cart/create-payment/${paymentMethod}`, {
      amount: totalAmount,
    });

    if (res.data.success) {
      clientSecret = res.data.clientSecret;
      elements = stripe.elements({ clientSecret });
      const paymentElement = elements.create("payment");

      const container = document.getElementById("payment-element");
      const stripeBox = document.getElementById("stripe-box");
      const amountDisplay = document.getElementById("stripe-amount");

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

      try {
        paymentElement.mount(container);
      } catch (mountError) {
        console.error("Mount error:", mountError);
        showErrorModal(
          "Payment Setup Error",
          "Unable to load payment form. Please refresh and try again.",
        );
        return;
      }

      document.getElementById("btn-amount").textContent = formattedAmount;
      document.getElementById("stripe-submit-btn").onclick = () =>
        handleStripePayment(cartId);
    } else {
      showErrorModal(
        "Payment Initialization Failed",
        res.data.message || "Unable to initialize payment. Please try again.",
      );
    }
  } catch (err) {
    console.error("Payment init error:", err);
    let msg = "Failed to initialize payment. Please try again.";
    if (err.response)
      msg = err.response.data?.message || err.response.data?.error || msg;
    else if (err.request)
      msg = "Network error. Please check your connection and try again.";
    else msg = err.message || msg;
    showErrorModal("Payment Error", msg);
  }
}

/* --------------------------------------------------------
     Stripe – confirm & create order
     -------------------------------------------------------- */
async function handleStripePayment(cartId) {
  const submitBtn = document.getElementById("stripe-submit-btn");
  const btnText = document.getElementById("btn-text");
  const btnAmount = document.getElementById("btn-amount");

  submitBtn.disabled = true;
  btnText.textContent = "Processing...";
  btnAmount.style.display = "none";

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/cart/checkout/create-order/${cartId}`,
      },
    });

    if (error) {
      showErrorModal("Payment Failed", error.message);
      submitBtn.disabled = false;
      btnText.textContent = "Pay Now";
      btnAmount.style.display = "inline";
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      btnText.textContent = "Creating Order...";

      const response = await axios.post(
        `/cart/checkout/create-order/${cartId}`,
        {
          payment_intent: paymentIntent.id,
          paymentMethod: "STRIPE",
        },
      );

      if (response.data.success) {
        showSuccessModal(
          "Payment Successful!",
          "Your order has been placed successfully. Redirecting to order summary...",
          response.data.redirect,
        );
      } else {
        showErrorModal(
          "Order Creation Failed",
          response.data.message ||
            "Payment succeeded but order creation failed. Please contact support.",
        );
        submitBtn.disabled = false;
        btnText.textContent = "Pay Now";
        btnAmount.style.display = "inline";
      }
    }
  } catch (err) {
    console.error("Payment error:", err);
    showErrorModal(
      "Payment Processing Error",
      err.response?.data?.message ||
        "An error occurred while processing your payment. Please try again.",
    );
    submitBtn.disabled = false;
    btnText.textContent = "Pay Now";
    btnAmount.style.display = "inline";
  }
}

/* --------------------------------------------------------
     COD
     -------------------------------------------------------- */
let codCartId = null;
let codPaymentMethod = null;

function openCodConfirmModal(div) {
  hideStripePayment(); // Hide Stripe payment form if it's open
  codCartId = div.getAttribute("data-cartid");
  codPaymentMethod = div.getAttribute("data-payment");
  document.getElementById("codConfirmModal").classList.add("show");
}

function closeCodConfirmModal() {
  document.getElementById("codConfirmModal").classList.remove("show");
  codCartId = null;
  codPaymentMethod = null;
}

async function confirmCOD() {
  const confirmBtn = document.querySelector("#codConfirmModal .co-btn-success");
  const originalText = confirmBtn.textContent;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Processing...";

  try {
    // Explicitly send COD as payment method to override session
    const requestData = {
      paymentMethod: "COD",
    };

    console.log("COD Request:", {
      url: `/cart/checkout/create-order/${codCartId}`,
      data: requestData,
    });

    const response = await axios.post(
      `/cart/checkout/create-order/${codCartId}`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.success) {
      closeCodConfirmModal();
      showSuccessModal(
        "Order Placed Successfully!",
        "Your order has been placed with Cash on Delivery.",
        response.data.redirect,
      );
    } else {
      closeCodConfirmModal();
      showErrorModal(
        "Order Failed",
        response.data.message ||
          "Unable to place your order. Please try again.",
      );
    }
  } catch (error) {
    closeCodConfirmModal();
    console.error("COD error:", error);
    console.error("Error response:", error.response?.data);

    let msg = "Failed to process your order. Please try again.";
    if (error.response) {
      msg = error.response.data?.message || error.response.data?.error || msg;
      console.error("Backend error message:", msg);
    } else if (error.request) {
      msg = "Network error. Please check your connection.";
    }
    showErrorModal("Order Processing Error", msg);

    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
}

/* --------------------------------------------------------
     Wallet
     -------------------------------------------------------- */
let walletCartId = null;
let walletPaymentMethod = null;
let walletAmount = 0;

async function openWalletConfirmModal(div) {
  hideStripePayment(); // Hide Stripe payment form if it's open
  walletCartId = div.getAttribute("data-cartid");
  walletPaymentMethod = div.getAttribute("data-payment");
  walletAmount = parseFloat(div.getAttribute("data-totalamount"));

  const modal = document.getElementById("walletConfirmModal");
  const amountDisplay = document.getElementById("walletAmount");
  const balanceDisplay = document.getElementById("walletBalance");
  const confirmBtn = document.getElementById("confirmWalletBtn");

  const formattedAmount = `₹${walletAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  amountDisplay.textContent = formattedAmount;
  modal.classList.add("show");

  /* fetch balance */
  try {
    balanceDisplay.textContent = "Loading...";
    balanceDisplay.style.color = "#667eea";
    confirmBtn.disabled = true;

    const response = await axios.get(
      `/cart/checkout/wallet-balence/${walletAmount}/${walletPaymentMethod}`,
    );

    if (response.data.success) {
      const balance = parseFloat(response.data.balance);
      const formattedBalance = `₹${balance.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      balanceDisplay.textContent = formattedBalance;

      if (balance < walletAmount) {
        balanceDisplay.style.color = "#dc3545";
        confirmBtn.disabled = true;
        showErrorModal(
          "Insufficient Balance",
          `Your wallet balance (${formattedBalance}) is insufficient for this payment (${formattedAmount}). Please add funds or choose another payment method.`,
        );
        closeWalletConfirmModal();
      } else {
        balanceDisplay.style.color = "#28a745";
        confirmBtn.disabled = false;
      }
    } else {
      throw new Error(
        response.data.message || "Failed to fetch wallet balance",
      );
    }
  } catch (error) {
    console.error("Wallet balance fetch error:", error);
    balanceDisplay.textContent = "Error loading balance";
    balanceDisplay.style.color = "#dc3545";
    confirmBtn.disabled = true;

    let msg = "Unable to fetch wallet balance. Please try again.";
    if (error.response)
      msg = error.response.data?.message || error.response.data?.error || msg;
    showErrorModal("Wallet Error", msg);
    closeWalletConfirmModal();
  }
}

function closeWalletConfirmModal() {
  document.getElementById("walletConfirmModal").classList.remove("show");
  walletCartId = null;
  walletPaymentMethod = null;
  walletAmount = 0;
}

async function confirmWallet() {
  const confirmBtn = document.getElementById("confirmWalletBtn");
  const originalText = confirmBtn.textContent;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Processing...";

  try {
    const response = await axios.post(
      `/cart/checkout/create-order/${walletCartId}`,
      {
        paymentMethod: walletPaymentMethod,
        amount: walletAmount,
      },
    );

    if (response.data.success) {
      closeWalletConfirmModal();
      showSuccessModal(
        "Payment Successful!",
        "Your order has been placed successfully using wallet payment.",
        response.data.redirect,
      );
    } else {
      closeWalletConfirmModal();
      throw new Error(
        response.data.message || "Unable to complete wallet payment",
      );
    }
  } catch (error) {
    closeWalletConfirmModal();
    console.error("Wallet payment error:", error);
    let msg = "Failed to process wallet payment. Please try again.";
    if (error.response)
      msg = error.response.data?.message || error.response.data?.error || msg;
    else if (error.request)
      msg = "Network error. Please check your connection.";
    showErrorModal("Wallet Payment Error", msg);
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
}

/* --------------------------------------------------------
     Global axios error interceptor
     -------------------------------------------------------- */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios interceptor caught error:", error);
    if (!error.config.skipGlobalErrorHandler) {
      let msg = "An unexpected error occurred. Please try again.";
      if (error.response)
        msg = error.response.data?.message || error.response.data?.error || msg;
      else if (error.request)
        msg = "Network error. Please check your connection.";
      showErrorModal("Error", msg);
    }
    return Promise.reject(error);
  },
);
