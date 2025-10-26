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
    } else if (name.length < 3) {
      nameError.textContent = "Name length atleast 3 letters";
      nameError.style.display = "block";
    } else {
      nameError.textContent = "";
      nameError.style.display = "none";
    }
  }
  //email validation
  function emailValidation() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      emailError.textContent = "Email is requierd";
      emailError.style.display = "block";
    } else if (!emailRegex.test(email)) {
      emailError.textContent = "Invalid Email";
      emailError.style.display = "block";
    } else {
      emailError.textContent = "";
      emailError.style.display = "none";
    }
  }
  //password validation
  function passwordValidation() {
    const password = passwordInput.value.trim();
    if (!password) {
      passwordError.textContent = "Password is requierd";
      passwordError.style.display = "block";
    } else if (password.length < 8) {
      passwordError.textContent = "Password length atleast 8 letters";
      passwordError.style.display = "block";
    } else {
      passwordError.textContent = "";
      passwordError.style.display = "none";
    }
  }
  //confirm password validation
  function confirmPasswordValidation() {
    const confirmPassword = confirmPasswordInput.value.trim();
    const password = passwordInput.value.trim();
    if (!confirmPassword) {
      confirmPasswordError.textContent = "Confirm password is requierd";
      confirmPasswordError.style.display = "block";
    } else if (confirmPassword === password) {
      confirmPasswordError.textContent = "Mismatch password";
      confirmPasswordError.style.display = "block";
    } else {
      confirmPasswordError.textContent = "";
      confirmPasswordError.style.display = "none";
    }
  }

  nameInput.addEventListener("input", nameValidation);
  emailInput.addEventListener("input", emailValidation);
  passwordInput.addEventListener("input", passwordValidation);
  confirmPasswordInput.addEventListener("input", confirmPasswordValidation);
});
