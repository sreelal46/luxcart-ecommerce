document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll('input[name^="otp"]');
  const serverMessage = document.getElementById("serverMessage");
  const OTPVerificationForm = document.getElementById("OTPVerificationForm");

  // Auto-focus first input
  if (otpInputs.length > 0) otpInputs[0].focus();

  otpInputs.forEach((input, index) => {
    // Allow digits only & move to next input
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, ""); // only digits

      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      // Auto submit if all filled
      const allFilled = Array.from(otpInputs).every((inp) => inp.value);
      if (allFilled) OTPVerificationForm.requestSubmit();
    });

    // Backspace → previous input
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Paste OTP
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim()
        .replace(/\D/g, "");

      if (!pasteData) return;

      otpInputs.forEach((otpInput, i) => {
        otpInput.value = pasteData[i] || "";
      });

      const nextEmpty = Array.from(otpInputs).find((inp) => !inp.value);
      if (nextEmpty) nextEmpty.focus();
      else OTPVerificationForm.requestSubmit();
    });
  });

  // Submit handler
  OTPVerificationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    serverMessage.classList.add("d-none");
    serverMessage.textContent = "";

    const formData = Object.fromEntries(
      new FormData(OTPVerificationForm).entries(),
    );
    const otp = Object.values(formData).join("");
    const OTPRegex = /^\d{6}$/;

    if (!OTPRegex.test(otp)) {
      serverMessage.className = "alert alert-danger text-center";
      serverMessage.textContent = "Please enter a valid 6-digit numeric OTP";
      serverMessage.classList.remove("d-none");
      return;
    }

    // Show verifying alert
    serverMessage.className = "alert alert-info text-center";
    serverMessage.textContent = "Verifying OTP...";
    serverMessage.classList.remove("d-none");

    try {
      const res = await axios.post("/admin/otp-verify", formData, {
        withCredentials: true,
      });

      if (res.data.success) {
        serverMessage.className = "alert alert-success text-center";
        serverMessage.textContent = "OTP verified! Redirecting...";
        serverMessage.classList.remove("d-none");
        setTimeout(() => (window.location.href = res.data.redirect), 800);
      } else {
        serverMessage.className = "alert alert-danger text-center";
        serverMessage.textContent =
          res.data.alert || "Invalid OTP. Please try again.";
        serverMessage.classList.remove("d-none");
      }
    } catch (error) {
      serverMessage.className = "alert alert-danger text-center";
      serverMessage.textContent =
        error.response?.data?.alert || "Server error. Please try again.";
      serverMessage.classList.remove("d-none");
    }
  });
});
