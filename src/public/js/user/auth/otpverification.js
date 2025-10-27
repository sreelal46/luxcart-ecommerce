document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll('input[name^="otp"]');
  const serverMessage = document.getElementById("serverMessage");
  const OTPVerificationForm = document.getElementById("OTPVerificationForm");

  // Auto focus first input when page loads
  if (otpInputs.length > 0) otpInputs[0].focus();

  otpInputs.forEach((input, index) => {
    // Allow only digits & move forward
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, ""); // numeric only

      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      // Auto submit when all fields filled
      const allFilled = Array.from(otpInputs).every((inp) => inp.value);
      if (allFilled) {
        OTPVerificationForm.requestSubmit();
      }
    });

    // Move backward on Backspace
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Handle paste (auto-fill OTP)
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim()
        .replace(/\D/g, ""); // only numbers

      if (!pasteData) return;

      otpInputs.forEach((otpInput, i) => {
        otpInput.value = pasteData[i] || "";
      });

      const nextEmpty = Array.from(otpInputs).find((inp) => !inp.value);
      if (nextEmpty) nextEmpty.focus();
      else OTPVerificationForm.requestSubmit(); // auto-submit if all filled
    });
  });

  // Submit handling
  OTPVerificationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    serverMessage.textContent = "";
    serverMessage.style.display = "none";

    const formData = Object.fromEntries(
      new FormData(OTPVerificationForm).entries()
    );
    const otp = Object.values(formData).join("");
    const OTPRegex = /^\d{6}$/;

    if (!OTPRegex.test(otp)) {
      serverMessage.textContent = "Please enter a valid 6-digit numeric OTP";
      serverMessage.style.display = "block";
      return;
    }

    try {
      const res = await axios.post("/verify-otp", formData, {
        withCredentials: true,
      });

      if (res.data.success) {
        window.location.href = res.data.redirect;
      } else {
        serverMessage.textContent = res.data.alert || "Something went wrong";
        serverMessage.style.display = "block";
      }
    } catch (error) {
      serverMessage.textContent =
        error.response?.data?.alert || "Something went wrong";
      serverMessage.style.display = "block";
    }
  });
});
