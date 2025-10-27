document.addEventListener("DOMContentLoaded", () => {
  const serverMessage = document.getElementById("serverMessage");
  const emailVerifyForm = document.getElementById("emailVerifyForm");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");

  // Helper function to validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  //reset message
  emailError.textContent = "";
  emailError.style.display = "none";

  //email validation
  function emailValidation() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      emailError.textContent = "Email is requierd.";
      emailError.style.display = "block";
    } else if (!emailRegex.test(email)) {
      emailError.textContent = "Invalid email format.";
      emailError.style.display = "block";
    } else {
      emailError.style.display = "none";
    }
  }

  //live validation
  emailInput.addEventListener("input", emailValidation);

  emailVerifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    //reset message
    serverMessage.textContent = "";
    serverMessage.style.display = "none";

    const email = emailInput.value.trim();

    if (!email || !validateEmail(email)) {
      emailError.style.display = "block";
      return;
    }

    try {
      Swal.fire({
        title: "Sending OTP...",
        html: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        "/send-otp",
        { email },
        { withCredentials: true }
      );
      Swal.close();
      if (res.data.success) {
        window.location.href = res.data.redirect;
      } else {
        serverMessage.textContent = res.data.alert || "Email not Found";
        serverMessage.style.display = "block";
      }
    } catch (error) {
      Swal.close();
      serverMessage.textContent =
        error.response?.data?.alert || "Somthing Worng";
      serverMessage.style.display = "block";
    }
  });
});
