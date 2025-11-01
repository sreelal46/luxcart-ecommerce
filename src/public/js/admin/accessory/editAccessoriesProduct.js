document.addEventListener("DOMContentLoaded", () => {
  const imageGallery = document.getElementById("image-gallery");
  const cropperModal = document.getElementById("cropperModal");
  const cropperImage = document.getElementById("cropperImage");
  const cropCancelBtn = document.getElementById("cropCancel");
  const cropSaveBtn = document.getElementById("cropSave");
  const editAccessoryForm = document.getElementById("editAccessoryForm");
  const accessoryId = document.getElementById("accessoryId").value;

  let cropper;
  let currentInput;
  let removedImages = [];

  // --- VALIDATION LOGIC ---
  function normalizeName(raw) {
    if (!raw) return "";
    let s = raw.replace(/\]\[/g, "_").replace(/\[|\]/g, "_");
    s = s.replace(/__+/g, "_");
    s = s.replace(/[-.]/g, "_");
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    s = s.toLowerCase().replace(/^_+|_+$/g, "");
    return s;
  }

  function ensureErrorSpan(input) {
    if (!input) return null;
    let next = input.nextElementSibling;
    if (next && next.classList.contains("text-danger")) return next;
    const span = document.createElement("span");
    span.className = "text-danger small";
    span.style.display = "none";
    span.style.marginTop = "4px";
    input.parentNode.insertBefore(span, input.nextSibling);
    return span;
  }

  function showError(input, message) {
    const span = ensureErrorSpan(input);
    if (span) {
      span.textContent = message;
      span.style.display = "block";
    }
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
  }

  function clearError(input) {
    const span = ensureErrorSpan(input);
    if (span) {
      span.textContent = "";
      span.style.display = "none";
    }
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  }

  const validators = {
    name: (v) => (v && v.trim() !== "") || "Name is required.",
    price: (v) => (v && v.trim() !== "") || "Price is required.",
    material: (v) => (v && v.trim() !== "") || "Material is required.",
    stock: (v) => (v && v.trim() !== "") || "Stock is required.",
    category_id: (v) => (v && v.trim() !== "") || "Category is required.",
    product_type_id: (v) =>
      (v && v.trim() !== "") || "Product type is required.",
    brand_id: (v) => (v && v.trim() !== "") || "Brand is required.",
    description: (v) => (v && v.trim() !== "") || "Description is required.",
    country_of_origin: (v) =>
      (v && v.trim() !== "") || "Country of Origin is required.",
    fabric: (v) => (v && v.trim() !== "") || "Fabric is required.",
    finish: (v) => (v && v.trim() !== "") || "Finish is required.",
    fitting: (v) => (v && v.trim() !== "") || "Fitting is required.",
    warranty: (v) => (v && v.trim() !== "") || "Warranty is required.",
    waterproof: (v) =>
      typeof v === "boolean" ||
      v === "true" ||
      v === "false" ||
      "Waterproof is required.",
    vehicle: (v) => (v && v.trim() !== "") || "Vehicle is required.",
    production_year: (v) =>
      (v && v.trim() !== "") || "Production year is required.",
  };

  function runValidatorForElement(el) {
    if (!el || !el.name) return true;
    const normalized = normalizeName(el.name.replace(/\[\]$/, ""));
    let value = el.type === "checkbox" ? el.checked : el.value;
    if (typeof value === "string") value = value.trim();
    if (validators[normalized]) {
      const res = validators[normalized](value);
      if (res === true || res === undefined) {
        clearError(el);
        return true;
      } else {
        showError(el, res);
        return false;
      }
    } else {
      clearError(el);
      return true; // ignore fields without explicit validation
    }
  }

  editAccessoryForm.addEventListener("input", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  editAccessoryForm.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  editAccessoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;
    const fields = editAccessoryForm.querySelectorAll(
      "input[name], select[name], textarea[name]"
    );
    for (const el of fields) {
      if (!runValidatorForElement(el)) valid = false;
    }
    if (!valid) {
      const firstInvalid = editAccessoryForm.querySelector(".is-invalid");
      if (firstInvalid)
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // ---- original submit logic below ----
    const formData = new FormData(editAccessoryForm);
    formData.append("removed_images", JSON.stringify(removedImages));
    try {
      Swal.fire({
        title: "Saving Accessory...",
        html: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const res = await axios.put(
        `/admin/products-management/edit-accessories-product/${accessoryId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      Swal.close();
      if (res.data.success) {
        Swal.fire({
          title: "Product Updated Successfully!",
          text: "Your Accessory product details have been updated.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          window.location.href = res.data.redirect;
        });
      } else {
        Swal.fire({
          title: "Update Failed",
          text:
            res.data.message ||
            "Something went wrong while updating the product.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      if (error.response) {
        Swal.close();
        Swal.fire({
          title: "Server Error",
          text:
            error.response.data.message ||
            "Something went wrong on the server.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else if (error.request) {
        Swal.fire({
          title: "No Response",
          text: "The server did not respond. Please try again later.",
          icon: "warning",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Request Error",
          text: "An unexpected error occurred.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  });

  // --- IMAGE LOGIC ---

  imageGallery.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      const imageBox = e.target.closest(".image-box");
      if (imageBox.dataset.src) {
        removedImages.push(imageBox.dataset.src);
      }
      imageBox.remove();
    }
  });

  imageGallery.querySelector(".add-image-btn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.name = "images";
    input.style.display = "none";
    document.body.appendChild(input);
    currentInput = input;
    input.addEventListener("change", () => {
      if (input.files.length) {
        const reader = new FileReader();
        reader.onload = (event) => {
          cropperImage.src = event.target.result;
          cropperModal.style.display = "flex";
          cropper = new Cropper(cropperImage, {
            aspectRatio: NaN,
            viewMode: 1,
            movable: true,
            zoomable: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
            responsive: true,
            background: true,
          });
        };
        reader.readAsDataURL(input.files[0]);
      }
    });
    input.click();
  });

  cropCancelBtn.addEventListener("click", () => {
    if (cropper) cropper.destroy();
    cropperModal.style.display = "none";
    if (currentInput) {
      currentInput.value = "";
      currentInput.remove();
      currentInput = null;
    }
  });

  cropSaveBtn.addEventListener("click", () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 4096,
      maxHeight: 4096,
    });
    canvas.toBlob((blob) => {
      const fileName = `cropped-accessory-${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      currentInput.files = dataTransfer.files;
      const form = document.getElementById("editAccessoryForm");
      form.appendChild(currentInput);
      const imageBox = document.createElement("div");
      imageBox.classList.add(
        "image-box",
        "shadow-sm",
        "rounded",
        "overflow-hidden",
        "position-relative"
      );
      const img = document.createElement("img");
      img.src = URL.createObjectURL(croppedFile);
      imageBox.appendChild(img);
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-image-btn";
      removeBtn.innerHTML = "&times;";
      imageBox.appendChild(removeBtn);
      imageGallery.insertBefore(
        imageBox,
        imageGallery.querySelector(".add-image-btn")
      );
      cropper.destroy();
      cropperModal.style.display = "none";
      currentInput = null;
    }, "image/jpeg");
  });
});
