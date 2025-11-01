document.addEventListener("DOMContentLoaded", () => {
  let cropper = null;
  let currentInput = null;
  const cropModalEl = document.getElementById("cropModal");
  const cropModal = bootstrap.Modal.getOrCreateInstance(cropModalEl);

  // Validation related functions

  const accessoryForm = document.getElementById("accessoryForm");

  function normalizeName(raw) {
    if (!raw) return "";
    let s = raw.replace(/\]\[/g, "_").replace(/\[|\]/g, "_");
    s = s.replace(/__+/g, "_");
    s = s.replace(/[-.]/g, "_");
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    s = s.toLowerCase().replace(/^_+|_+$/g, "");
    s = s.replace(/^variant_\d+_/, "variant_");

    const aliasMap = {
      countryoforigin: "country_of_origin",
      producttypeid: "product_type_id",
      categoryid: "category_id",
      brandid: "brand_id",
    };
    return aliasMap[s] || s;
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
    name: (v) => (v && v.length > 1) || "Name is required.",
    category_id: (v) => (v && v !== "") || "Category is required.",
    product_type_id: (v) => (v && v !== "") || "Product Type is required.",
    brand_id: (v) => (v && v !== "") || "Brand is required.",
    description: (v) => (v && v.length > 3) || "Description is required.",
    country_of_origin: (v) =>
      (v && v.trim() !== "") || "Country of origin is required.",
    fabric: (v) => (v && v.trim() !== "") || "Fabric is required.",
    finish: (v) => (v && v.trim() !== "") || "Finish is required.",
    fitting: (v) => (v && v.trim() !== "") || "Fitting is required.",
    warranty: (v) => (v && v.trim() !== "") || "Warranty is required.",
    waterproof: (v) =>
      ["true", "false"].includes(String(v)) || "Select waterproof option.",
    vehicle: (v) => (v && v.trim() !== "") || "Vehicle is required.",
    production_year: (v) =>
      v === "" || (!isNaN(v) && Number(v) > 1900) || "Enter valid year.",
    price: (v) => (v && v.trim() !== "") || "Enter valid price.",
    stock: (v) => (v && v.trim() !== "") || "Enter valid stock.",
    material: (v) => (v && v.trim() !== "") || "Material is required.",
  };

  function runValidatorForElement(el) {
    if (!el || !el.name) return true;
    const raw = el.name.replace(/\[\]$/, "");
    if (raw.startsWith("variant_") && raw.includes("_images")) {
      clearError(el);
      return true;
    }
    const normalized = normalizeName(raw);
    let value =
      el.type === "checkbox" ? (el.checked ? "true" : "false") : el.value;
    if (typeof value === "string") value = value.trim();
    const validator = validators[normalized];
    if (validator) {
      const res = validator(value);
      if (res === true || res === undefined) {
        clearError(el);
        return true;
      } else {
        showError(el, res);
        return false;
      }
    } else {
      showError(
        el,
        `No validator defined for "${raw}" (normalized: "${normalized}").`
      );
      return false;
    }
  }

  accessoryForm.addEventListener("input", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  accessoryForm.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  accessoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;
    const inputs = accessoryForm.querySelectorAll(
      "input[name], select[name], textarea[name]"
    );
    inputs.forEach((el) => {
      if (!runValidatorForElement(el)) valid = false;
    });
    if (!valid) {
      const firstInvalid = accessoryForm.querySelector(".is-invalid");
      if (firstInvalid)
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const formData = new FormData(accessoryForm);
    try {
      Swal.fire({
        title: "Saving Accessory...",
        html: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const res = await axios.post(
        "/admin/products-management/add-accessories-product",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      Swal.close();
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Accessory Added Successfully",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = res.data.redirect;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Add Accessory",
          text: res.data.message || "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Server error occurred",
      });
    }
  });

  // Your existing Add Image / Cropper logic comes after here...

  // Add image upload box
  function addImageBox(variantSection, variantIndex) {
    const imageContainer = variantSection.querySelector(
      ".variant-images-container"
    );
    const uploadBox = document.createElement("div");
    uploadBox.classList.add(
      "upload-box",
      "d-flex",
      "flex-column",
      "justify-content-center",
      "align-items-center",
      "border",
      "rounded",
      "mt-3",
      "p-4",
      "position-relative"
    );
    uploadBox.style.width = "300px";
    uploadBox.style.height = "250px";
    uploadBox.style.cursor = "pointer";
    uploadBox.style.textAlign = "center";
    uploadBox.style.transition = "0.3s";
    uploadBox.style.background = "#f8f9fa";
    uploadBox.innerHTML = `
      <i class="bi bi-cloud-arrow-up fs-1 text-secondary"></i>
      <p class="mt-2 mb-1 fw-semibold text-muted">Click to upload image</p>
      <small class="text-muted">PNG, JPG, JPEG (max 5MB)</small>
      <input type="file" name="variant_images_${variantIndex}[]" hidden accept="image/*" />
      <div class="image-preview mt-3"></div>
      <button type="button" class="btn btn-sm btn-outline-danger remove-image-btn position-absolute top-0 end-0 m-1 rounded-circle">
        <i class="bi bi-x-lg"></i>
      </button>
    `;
    uploadBox.addEventListener("mouseenter", () => {
      uploadBox.style.background = "#e9ecef";
    });
    uploadBox.addEventListener("mouseleave", () => {
      uploadBox.style.background = "#f8f9fa";
    });
    imageContainer.appendChild(uploadBox);

    uploadBox.addEventListener("click", (e) => {
      if (e.target.closest(".remove-image-btn")) return;
      uploadBox.querySelector("input").click();
    });
    uploadBox
      .querySelector(".remove-image-btn")
      .addEventListener("click", () => {
        uploadBox.remove();
      });
  }

  function bindStaticAddImageButtons() {
    document.querySelectorAll(".upload-card.add-image-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const variantSection = btn.closest(".variant-section");
        const variantIndex =
          parseInt(variantSection.getAttribute("data-variant-index")) || 1;
        addImageBox(variantSection, variantIndex);
      });
    });
  }
  bindStaticAddImageButtons();

  document.addEventListener("change", (e) => {
    if (e.target.matches("input[type='file'][name^='variant_images']")) {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.match("image.*")) {
        alert("Please select an image file");
        e.target.value = null;
        return;
      }
      currentInput = e.target;
      const img = document.getElementById("cropImage");
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
        cropModal.show();
      };
      reader.readAsDataURL(file);
    }
  });

  cropModalEl.addEventListener("shown.bs.modal", () => {
    if (!cropper && currentInput) {
      const img = document.getElementById("cropImage");
      cropper = new Cropper(img, {
        viewMode: 2,
        autoCropArea: 0.95,
        responsive: true,
        background: false,
        zoomable: true,
        cropBoxResizable: true,
      });
    }
  });

  document.getElementById("cropConfirm").addEventListener("click", () => {
    if (!cropper || !currentInput) return;
    const btn = document.getElementById("cropConfirm");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    setTimeout(() => {
      try {
        const canvas = cropper.getCroppedCanvas({
          maxWidth: 4096,
          maxHeight: 4096,
        });
        canvas.toBlob(
          (blob) => {
            const newFile = new File([blob], currentInput.files[0].name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(newFile);
            currentInput.files = dataTransfer.files;

            const previewContainer = currentInput
              .closest(".upload-box")
              ?.querySelector(".image-preview");
            if (previewContainer) {
              previewContainer.innerHTML = "";
              const imgPreview = document.createElement("img");
              imgPreview.src = URL.createObjectURL(newFile);
              imgPreview.style.width = "100%";
              imgPreview.style.borderRadius = "8px";
              previewContainer.appendChild(imgPreview);
            }

            if (cropper) {
              cropper.destroy();
              cropper = null;
            }
            currentInput = null;
            cropModal.hide();

            setTimeout(() => {
              document.body.classList.remove("modal-open");
              document
                .querySelectorAll(".modal-backdrop")
                .forEach((el) => el.remove());
            }, 150);
          },
          "image/jpeg",
          0.95
        );
      } catch (err) {
        cropModal.hide();
        document.body.classList.remove("modal-open");
        document
          .querySelectorAll(".modal-backdrop")
          .forEach((el) => el.remove());
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }, 100);
  });

  cropModalEl.addEventListener("hidden.bs.modal", () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    currentInput = null;
    setTimeout(() => {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    }, 150);
  });

  document.querySelectorAll(".remove-variant").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".variant-section").remove();
    });
  });
});
