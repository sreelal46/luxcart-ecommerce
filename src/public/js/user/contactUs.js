const form = document.getElementById("contactForm");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");

// Live validation for all form fields
const formFields = form.querySelectorAll("input, textarea");

formFields.forEach((field) => {
  // Validate on blur (when user leaves the field)
  field.addEventListener("blur", () => {
    validateField(field);
  });

  // Validate on input (as user types) - instant validation
  field.addEventListener("input", () => {
    validateField(field);
  });
});

function validateField(field) {
  // Skip validation for optional phone field if empty
  if (field.name === "phone" && field.value.trim() === "") {
    field.classList.remove("is-valid", "is-invalid");
    return true;
  }

  // Check if field is valid
  if (field.checkValidity()) {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
    return true;
  } else {
    field.classList.remove("is-valid");
    field.classList.add("is-invalid");
    return false;
  }
}

function validateAllFields() {
  let isValid = true;
  formFields.forEach((field) => {
    if (!validateField(field) && field.required) {
      isValid = false;
    }
  });
  return isValid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate all fields before submission
  if (!validateAllFields()) {
    // Focus on first invalid field
    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return;
  }

  btnText.classList.add("d-none");
  btnLoader.classList.remove("d-none");

  const formData = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    subject: form.subject.value,
    message: form.message.value,
  };

  try {
    const res = await axios.post("/api/contact", formData);

    if (res.data.success) {
      form.reset();

      // Remove validation classes after reset
      formFields.forEach((field) => {
        field.classList.remove("is-valid", "is-invalid");
      });

      const modal = new bootstrap.Modal(
        document.getElementById("successModal"),
      );
      modal.show();
    }
  } catch (error) {
    alert("Something went wrong. Please try again.");
  } finally {
    btnText.classList.remove("d-none");
    btnLoader.classList.add("d-none");
  }
});
