const fields = [
  "fullName",
  "email",
  "phone",
  "label",
  "street",
  "landmark",
  "city",
  "district",
  "state",
  "zip",
];

function validateField(id) {
  const value = document.getElementById(id).value.trim();
  const error = document.getElementById(id + "Error");
  const input = document.getElementById(id);

  // Required field check
  if (!value) {
    error.textContent = "This field is required";
    input.classList.add("invalid");
    return false;
  }

  // Email validation
  if (id === "email" && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
    error.textContent = "Enter a valid email address";
    input.classList.add("invalid");
    return false;
  }

  // Phone validation (10 digits, no repeated digits, numeric only)
  // Phone validation (Strict Indian phone rules)
  if (id === "phone") {
    const v = value;

    // Required
    if (!v) {
      error.textContent = "Phone number is required.";
      input.classList.add("invalid");
      return false;
    }

    // Must start with 6-9 and be 10 digits
    if (!/^[6-9]\d{9}$/.test(v)) {
      error.textContent = "Enter valid 10-digit Indian mobile number.";
      input.classList.add("invalid");
      return false;
    }

    // Reject all repeating digits: 0000000000, 1111111111...
    if (/^(\d)\1{9}$/.test(v)) {
      error.textContent = "Phone number cannot be all repeating digits.";
      input.classList.add("invalid");
      return false;
    }

    // Valid
    error.textContent = "";
    input.classList.remove("invalid");
    return true;
  }

  // ZIP/Postal Code (6 digits only)
  if (id === "zip") {
    if (!/^\d{6}$/.test(value)) {
      error.textContent = "ZIP/Postal Code must be exactly 6 digits";
      input.classList.add("invalid");
      return false;
    }
  }

  // Clear error if valid
  error.textContent = "";
  input.classList.remove("invalid");
  return true;
}

/* ==========================
    CUSTOM ERROR POPUP
  ========================== */
const CustomSwal = {};
CustomSwal.error = (title = "Error", text = "Something went wrong.") => {
  const box = document.getElementById("customSwalError");
  document.getElementById("customSwalErrorTitle").textContent = title;
  document.getElementById("customSwalErrorText").textContent = text;
  box.classList.add("show");
  document.getElementById("customSwalErrorBtn").onclick = () =>
    box.classList.remove("show");
};

fields.forEach((id) => {
  document
    .getElementById(id)
    .addEventListener("input", () => validateField(id));
});

document.getElementById("addressForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  let valid = true;
  fields.forEach((id) => {
    if (!validateField(id)) valid = false;
  });

  if (!valid) return;
  const userId = document.getElementById("userId").value;
  const data = {};
  fields.forEach((id) => (data[id] = document.getElementById(id).value.trim()));

  try {
    const res = await axios.post(
      `/account/addresses/add-address/${userId}`,
      data
    );
    if (res.data.success) {
      window.location.href = res.data.redirect;
    } else {
      CustomSwal.error(
        "Save Failed",
        err.response?.data?.alert || "Server error occurred."
      );
    }
  } catch (err) {
    CustomSwal.error(
      "Save Failed",
      err.response?.data?.alert || "Server error occurred."
    );
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  window.location.href = "/account/addresses";
});
