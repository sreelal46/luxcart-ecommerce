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

  if (!value) {
    error.textContent = "This field is required";
    input.classList.add("invalid");
    return false;
  }

  if (id === "email" && !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
    error.textContent = "Enter a valid email address";
    input.classList.add("invalid");
    return false;
  }

  if (id === "phone") {
    const v = value;
    if (!/^[6-9]\d{9}$/.test(v)) {
      error.textContent = "Enter valid 10-digit Indian mobile number.";
      input.classList.add("invalid");
      return false;
    }
  }

  if (id === "zip" && !/^\d{6}$/.test(value)) {
    error.textContent = "ZIP/Postal Code must be exactly 6 digits";
    input.classList.add("invalid");
    return false;
  }

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

/* ==========================
    FORM SUBMIT HANDLER
  ========================== */
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

  const addressId = document.getElementById("addressId").value;
  const data = {};
  fields.forEach((id) => (data[id] = document.getElementById(id).value.trim()));

  try {
    const res = await axios.put(
      `/account/addresses/edit-address/${addressId}`,
      data
    );

    if (res.data.success) {
      window.location.href = res.data.redirect;
    } else {
      CustomSwal.error(
        "Save Failed",
        res.data.alert || "Server error occurred."
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
