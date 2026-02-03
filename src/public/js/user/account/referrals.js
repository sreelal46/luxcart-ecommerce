function showMobileAlert(message, notification) {
  const alertBox = document.getElementById("mobileAlert");
  if (notification === "success") {
    alertBox.innerHTML = `<i class="bi bi-check-circle-fill success-icon"></i><span class="message-green">${message}</span>`;
    alertBox.classList.add("show");
  } else if (notification === "error") {
    alertBox.innerHTML = `<i class="bi bi-x-circle-fill error-icon"></i><span class="message-red">${message}</span>`;
    alertBox.classList.add("show");
  } else if (notification === "warning") {
    alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill yellow-icon"></i><span class="message-yellow">${message}</span>`;
    alertBox.classList.add("show");
  }

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, 2000);
}
function copyReferralCode() {
  const text = document.getElementById("referralCode").innerText;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showMobileAlert("Referral code copied!", "success");
    })
    .catch(() => {
      showMobileAlert("Failed to copy", "error");
    });
}
