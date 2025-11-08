document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const nameInput = document.getElementById("name");
  const nameError = document.getElementById("nameError");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  const passwordInput = document.getElementById("password");
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const confirmPasswordError = document.getElementById("confirmPasswordError");
  const referralCodeInput = document.getElementById("referralCode");
  const serverMessage = document.getElementById("serverMessage");

  // Helper function to validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  //reset values
  nameError.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
  confirmPasswordError.textContent = "";

  //name validation
  function nameValidation() {
    const name = nameInput.value.trim();
    if (!name) {
      nameError.textContent = "Name is requierd";
      nameError.style.display = "block";
      return false;
    } else if (name.length < 3) {
      nameError.textContent = "Name length atleast 3 letters";
      nameError.style.display = "block";
      return false;
    } else {
      nameError.style.display = "none";
      return true;
    }
  }
  //email validation
  function emailValidation() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      emailError.textContent = "Email is requierd.";
      emailError.style.display = "block";
      return false;
    } else if (!emailRegex.test(email)) {
      emailError.textContent = "Invalid email format.";
      emailError.style.display = "block";
      return false;
    } else {
      emailError.style.display = "none";
      return true;
    }
  }
  //password validation
  function passwordValidation() {
    const password = passwordInput.value.trim();
    if (!password) {
      passwordError.textContent = "Password is requierd.";
      passwordError.style.display = "block";
      return false;
    } else if (password.length < 8) {
      passwordError.textContent = "Password length atleast 8 letters.";
      passwordError.style.display = "block";
      return false;
    } else {
      passwordError.style.display = "none";
      return true;
    }
  }
  //confirm password validation
  function confirmPasswordValidation() {
    const confirmPassword = confirmPasswordInput.value.trim();
    const password = passwordInput.value.trim();
    if (!confirmPassword) {
      confirmPasswordError.textContent = "Confirm password is requierd.";
      confirmPasswordError.style.display = "block";
      return false;
    } else if (confirmPassword.length < 8) {
      confirmPasswordError.textContent =
        "Confirm Password length atleast 8 letters.";
      confirmPasswordError.style.display = "block";
      return false;
    } else if (confirmPassword !== password) {
      confirmPasswordError.textContent =
        "Confirm Password Must Match Password!.";
      confirmPasswordError.style.display = "block";
      return false;
    } else {
      confirmPasswordError.style.display = "none";
      return true;
    }
  }

  nameInput.addEventListener("input", nameValidation);
  emailInput.addEventListener("input", emailValidation);
  passwordInput.addEventListener("input", passwordValidation);
  confirmPasswordInput.addEventListener("input", confirmPasswordValidation);

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // reset Message
    serverMessage.style.display = "none";
    serverMessage.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const referralCode = referralCodeInput.value.trim();

    //final validation
    if (!name) {
      nameError.style.display = "block";
      return;
    }
    if (!email || !validateEmail(email)) {
      emailError.style.display = "block";
      return;
    }
    if (!password || password.length < 8) {
      passwordError.style.display = "block";
      return;
    }
    if (confirmPassword !== password) {
      confirmPasswordError.textContent = "Password length atleast 8 letters.";
      confirmPassword.style.display = "block";
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
        "/signup",
        {
          name,
          email,
          password,
          confirmPassword,
          referralCode,
        },
        { withCredentials: true }
      );
      Swal.close();
      if (res.data.success) {
        window.location.href = res.data.redirect;
      } else {
        Swal.close();
        serverMessage.textContent = res.data.alert || "Somthing worng";
        serverMessage.style.display = "block";
      }
    } catch (error) {
      Swal.close();
      serverMessage.textContent =
        error.response?.data?.alert || "Somthing went Worng";
      serverMessage.style.display = "block";
    }
  });
});
