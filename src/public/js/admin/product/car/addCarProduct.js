document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("variantSectionContainer");
  const addVariantBtn = document.getElementById("addVariantBtn");
  const cropModalEl = document.getElementById("cropModal");
  const cropModal = new bootstrap.Modal(cropModalEl);
  const form = document.getElementById("carProductForm");
  let cropper = null;
  let currentInput = null;

  function normalizeName(raw) {
    if (!raw) return "";
    let s = raw.replace(/\]\[/g, "_").replace(/\[|\]/g, "_");
    s = s.replace(/__+/g, "_");
    s = s.replace(/[-.]/g, "_");
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    s = s.toLowerCase().replace(/^_+|_+$/g, "");
    const aliasMap = {
      topspeed: "top_speed",
      top_speed: "top_speed",
      top_speed_kmh: "top_speed",
      topspeedkmh: "top_speed",
      power: "power_hp",
      power_hp: "power_hp",
      powerhp: "power_hp",
      powerrpm: "power_hp",
      torque: "torque",
      cameras: "cameras",
      mileage: "mileage",
      "0_100": "acceleration_0_100",
      acceleration0_100: "acceleration_0_100",
      drive: "drive_type",
      drivetype: "drive_type",
      drive_type: "drive_type",
      keylessgo: "keyless_go",
      keyless_go: "keyless_go",
      laneassist: "lane_assist",
      lane_assist: "lane_assist",
      variantcolor: "variant_color",
      variantcolors: "variant_color",
      variant_color: "variant_color",
      variantprice: "variant_price",
      variant_price: "variant_price",
      variantstock: "variant_stock",
      variant_stock: "variant_stock",
      variants_color: "variant_color",
      variants_price: "variant_price",
      variants_stock: "variant_stock",
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
    name: (v) =>
      (v && v.trim().length >= 3) || "Name must be at least 3 characters.",
    description: (v) =>
      (v && v.trim().length >= 10) ||
      "Description must be at least 10 characters.",
    brand: (v) => (v && v.trim() !== "") || "Brand is required.",
    category: (v) => (v && v.trim() !== "") || "Category is required.",
    product_type: (v) => (v && v.trim() !== "") || "Product Type is required.",
    year: (v) => {
      if (!v) return "Year is required.";
      const y = parseInt(v, 10),
        current = new Date().getFullYear();
      return (
        (y >= 1900 && y <= current) || `Enter a valid year (1900–${current}).`
      );
    },
    mileage: (v) =>
      (v && /^[0-9]+(\.[0-9]+)?$/.test(v)) || "Enter valid mileage.",
    warranty: (v) => (v && v.trim() !== "") || "Warranty is required.",
    region: (v) => (v && v.trim() !== "") || "Region is required.",
    top_speed: (v) =>
      (v && !isNaN(v) && Number(v) > 0) || "Enter a valid top speed.",
    power_hp: (v) =>
      (v && /^[0-9]+(\.[0-9]+)?$/.test(v)) || "Enter horsepower as a number.",
    engine: (v) => (v && v.trim() !== "") || "Engine is required.",
    transmission: (v) => (v && v.trim() !== "") || "Transmission is required.",
    drive_type: (v) => (v && v.trim() !== "") || "Drive type is required.",
    torque: (v) =>
      (v && /^[0-9xX\- ,Nm]+$/.test(v)) || "Enter torque (e.g. 350 Nm).",
    acceleration_0_100: (v) =>
      v === "" ||
      /^[0-9]+(\.[0-9]+)?$/.test(v) ||
      "Enter acceleration (seconds).",
    colors: (v) => (v && v.trim() !== "") || "Colors is required.",
    wheels: (v) => (v && v.trim() !== "") || "Wheels is required.",
    upholstery: (v) => (v && v.trim() !== "") || "Upholstery is required.",
    design: (v) => (v && v.trim() !== "") || "Design is required.",
    cameras: (v) => (v && v.length > 0) || "Enter cameras info.",
    lane_assist: (v) =>
      ["true", "false"].includes(String(v)) || "Select lane assist option.",
    sound_system: (v) => (v && v.trim() !== "") || "Sound system is required.",
    keyless_go: (v) =>
      ["true", "false"].includes(String(v)) || "Select keyless go option.",
    variant_color: (v) =>
      (v && v.trim() !== "") || "Variant color is required.",
    variant_price: (v) =>
      v === "" ||
      (!isNaN(v) && Number(v) > 0) ||
      "Variant price must be not equal to Zero.",
    variant_stock: (v) =>
      v === "" ||
      (Number.isInteger(Number(v)) && Number(v) > 0) ||
      "Variant stock must be a non-negative integer.",
  };

  const unmatchedNames = new Set();
  function runValidatorForElement(el) {
    if (!el || !el.name) return true;

    const raw = el.name.replace(/\[\]$/, "");
    if (raw.startsWith("variant_images")) {
      clearError(el);
      return true; // Skip validation for file inputs with dynamic variant_images names
    }

    const normalized = normalizeName(raw);
    const value =
      el.type === "checkbox" ? (el.checked ? "true" : "false") : el.value;
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
      unmatchedNames.add(raw);
      showError(
        el,
        `No validator defined for "${raw}" (normalized: "${normalized}").`
      );
      return false;
    }
  }

  form.addEventListener("input", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    unmatchedNames.clear();
    let valid = true;
    const elements = form.querySelectorAll(
      "input[name], textarea[name], select[name]"
    );
    elements.forEach((el) => {
      if (!runValidatorForElement(el)) valid = false;
    });

    if (unmatchedNames.size > 0) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Validation Incomplete",
          html: `Some fields do not have validators defined.<br><small>Open console (F12) → see unmatched field names.</small>`,
          timer: 3500,
          showConfirmButton: false,
        });
      }
      unmatchedNames.forEach((n) =>
        console.warn(`Missing validator for: ${n}`)
      );
    }

    if (!valid) {
      const first = form.querySelector(".is-invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Proceed with your form data submission here
    const formData = new FormData(form);

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    }
    try {
      const res = await axios.post(
        "/admin/products-management/add-car-product",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (typeof Swal !== "undefined") Swal.close();
      if (res.data?.success) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "success",
            title: "Car Added",
            timer: 1200,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = res.data.redirect;
          });
        } else {
          window.location.href = res.data.redirect;
        }
      } else {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Failed",
            text: res.data?.message || "Server error",
          });
        } else {
          alert(res.data?.message || "Server error");
        }
      }
    } catch (err) {
      if (typeof Swal !== "undefined") Swal.close();
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err?.response?.data?.message || "Server error",
        });
      } else {
        alert(err?.response?.data?.message || "Server error");
      }
    }
  });
  addVariantBtn.addEventListener("click", () => {
    const variants = container.querySelectorAll(".variant-section");
    const newIndex = variants.length;
    const clone = variants[0].cloneNode(true);

    const headerSpan = clone.querySelector(".card-header span");
    if (headerSpan) headerSpan.textContent = `Variant #${newIndex + 1}`;

    clone.querySelectorAll("input, textarea").forEach((i) => (i.value = ""));
    clone.querySelectorAll(".text-danger").forEach((s) => {
      s.textContent = "";
      s.style.display = "none";
    });
    clone
      .querySelectorAll(".is-invalid, .is-valid")
      .forEach((c) => c.classList.remove("is-invalid", "is-valid"));

    const imageContainer = clone.querySelector(".variant-images-container");
    if (imageContainer) {
      imageContainer.innerHTML = `<button type="button" class="btn btn-outline-primary btn-sm add-image-btn"><i class="bi bi-plus-circle"></i> Add Image</button>`;
      const btn = imageContainer.querySelector(".add-image-btn");
      if (btn)
        btn.addEventListener("click", (e) =>
          addImageBox(e.target.closest(".variant-section"), newIndex)
        );
    }

    const rem = clone.querySelector(".remove-variant");
    if (rem) {
      rem.classList.remove("d-none");
      rem.addEventListener("click", () => clone.remove());
    }

    container.appendChild(clone);
  });

  function addImageBox(variantSection, variantIndex) {
    const imageContainer = variantSection.querySelector(
      ".variant-images-container"
    );
    if (!imageContainer) return;
    const uploadBox = document.createElement("div");
    uploadBox.className =
      "upload-box border rounded mt-3 p-3 text-center position-relative";
    uploadBox.style.width = "280px";
    uploadBox.style.height = "240px";
    uploadBox.innerHTML = `
      <i class="bi bi-cloud-arrow-up fs-1 text-secondary"></i>
      <p class="mt-2 mb-1 fw-semibold text-muted">Click to upload image</p>
      <small class="text-muted">PNG, JPG, JPEG (max 5MB)</small>
      <input type="file" name="variant_images_${variantIndex}[]" hidden accept="image/*" />
      <div class="image-preview mt-2"></div>
      <button type="button" class="btn btn-sm btn-outline-danger remove-image-btn position-absolute top-0 end-0 m-1 rounded-circle"><i class="bi bi-x-lg"></i></button>
    `;
    imageContainer.appendChild(uploadBox);

    uploadBox.addEventListener("click", (ev) => {
      if (ev.target.closest(".remove-image-btn")) return;
      uploadBox.querySelector("input[type=file]").click();
    });
    uploadBox
      .querySelector(".remove-image-btn")
      .addEventListener("click", () => uploadBox.remove());
  }

  document.addEventListener("change", (e) => {
    if (e.target.matches("input[type='file'][name^='variant_images']")) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.match("image.*")) {
        alert("Please select an image file.");
        return;
      }
      currentInput = e.target;
      const img = document.getElementById("cropImage");
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target.result;
        cropModal.show();
      };
      reader.readAsDataURL(file);
    }
  });

  cropModalEl.addEventListener("shown.bs.modal", () => {
    const img = document.getElementById("cropImage");
    if (!img) return;
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
      viewMode: 2,
      autoCropArea: 0.95,
      responsive: true,
      background: false,
      zoomable: true,
      cropBoxResizable: true,
    });
  });

  document.getElementById("cropConfirm").addEventListener("click", () => {
    if (!cropper || !currentInput) return;
    const btn = document.getElementById("cropConfirm");
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    setTimeout(() => {
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
          const dt = new DataTransfer();
          dt.items.add(newFile);
          currentInput.files = dt.files;
          const preview = currentInput
            .closest(".upload-box")
            ?.querySelector(".image-preview");
          if (preview) {
            preview.innerHTML = "";
            const im = document.createElement("img");
            im.src = URL.createObjectURL(newFile);
            im.style.width = "100%";
            im.style.borderRadius = "8px";
            preview.appendChild(im);
          }
          cropper.destroy();
          cropper = null;
          currentInput = null;
          btn.disabled = false;
          btn.innerHTML = "Crop & Save";
          cropModal.hide();
        },
        "image/jpeg",
        0.95
      );
    }, 100);
  });

  cropModalEl.addEventListener("hidden.bs.modal", () => {
    if (cropper) cropper.destroy();
    cropper = null;
    currentInput = null;
  });

  const firstAdd = document.querySelector(".add-image-btn");
  if (firstAdd)
    firstAdd.addEventListener("click", (e) =>
      addImageBox(e.target.closest(".variant-section"), 0)
    );
});
