document.addEventListener("DOMContentLoaded", () => {
  let cropper;
  let currentInput;
  let currentVariantIndex;
  let removedImages = [];

  const editForm = document.getElementById("editCarProduct");

  function normalizeName(raw) {
    if (!raw) return "";
    let s = raw.replace(/\]\[/g, "_").replace(/\[|\]/g, "_");
    s = s.replace(/__+/g, "_");
    s = s.replace(/[-.]/g, "_");
    s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    s = s.toLowerCase().replace(/^_+|_+$/g, "");
    s = s.replace(/^variant_\d+_/, "variant_");

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
      interior_and_exterior_color: "interior_and_exterior_color",
      offer_price: "offer_price",
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
    name: (v) => (v && v.length >= 3) || "Name must be at least 3 characters.",
    description: (v) =>
      (v && v.length >= 10) || "Description must be at least 10 characters.",
    brand: (v) => (v && v !== "") || "Brand is required.",
    category: (v) => (v && v !== "") || "Category is required.",
    product_type: (v) => (v && v !== "") || "Product Type is required.",
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
    warranty: (v) => (v && v !== "") || "Warranty is required.",
    region: (v) => (v && v !== "") || "Region is required.",
    top_speed: (v) =>
      (v && !isNaN(v) && Number(v) > 0) || "Enter a valid top speed.",
    power_hp: (v) =>
      (v && /^[0-9]+(\.[0-9]+)?$/.test(v)) || "Enter horsepower as a number.",
    engine: (v) => (v && v !== "") || "Engine is required.",
    transmission: (v) => (v && v !== "") || "Transmission is required.",
    drive_type: (v) => (v && v !== "") || "Drive type is required.",
    torque: (v) =>
      (v && /^[0-9xX\- ,Nm]+$/.test(v)) || "Enter torque (e.g. 350 Nm).",

    // NEW: No number validation, just require non-blank
    acceleration_0_100: (v) => (v && v.length > 0) || "Enter acceleration.",
    cameras: (v) => (v && v.length > 0) || "Enter cameras info.",
    // If you want these fields truly optional, just use: acceleration_0_100: (v)=>true, cameras: (v)=>true

    colors: (v) => (v && v !== "") || "Colors is required.",
    wheels: (v) => (v && v !== "") || "Wheels is required.",
    upholstery: (v) => (v && v !== "") || "Upholstery is required.",
    design: (v) => (v && v !== "") || "Design is required.",
    lane_assist: (v) =>
      ["true", "false"].includes(String(v)) || "Select lane assist option.",
    sound_system: (v) => (v && v !== "") || "Sound system is required.",
    keyless_go: (v) =>
      ["true", "false"].includes(String(v)) || "Select keyless go option.",
    variant_color: (v) => (v && v !== "") || "Variant color is required.",
    variant_price: (v) =>
      v === "" ||
      (!isNaN(v) && Number(v) > 0) ||
      "Variant price must be a not equal to Zero.",
    variant_stock: (v) =>
      v === "" ||
      (Number.isInteger(Number(v)) && Number(v) > 0) ||
      "Variant stock must be a non-negative integer.",
    offer_price: (v) => {
      if (v === "") return true;
      return (!isNaN(v) && Number(v) >= 0) || "Enter a valid offer price.";
    },
    interior_and_exterior_color: (v) =>
      (v && v !== "") || "Colors is required.",
  };

  function runValidatorForElement(el) {
    if (!el || !el.name) return true;

    const raw = el.name.replace(/\[\]$/, "");
    if (
      raw === "product_id" ||
      raw.startsWith("variant_id_") ||
      (raw.startsWith("variant_") && raw.includes("_images"))
    ) {
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

  editForm.addEventListener("input", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  editForm.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.name) return;
    runValidatorForElement(t);
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let valid = true;
    const inputs = editForm.querySelectorAll(
      "input[name], select[name], textarea[name]"
    );
    inputs.forEach((el) => {
      if (!runValidatorForElement(el)) valid = false;
    });

    if (!valid) {
      const firstInvalid = editForm.querySelector(".is-invalid");
      if (firstInvalid)
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const productId = document.querySelector("input[name='product_id']").value;
    const formData = new FormData(editForm);
    formData.append("removed_images", JSON.stringify(removedImages));

    try {
      Swal.fire({
        title: "Saving Car...",
        html: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.put(
        `/admin/products-management/edit-car-product/${productId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      Swal.close();
      if (res.data.success) {
        Swal.fire({
          title: "Product Updated Successfully!",
          text: "Your car product details have been updated.",
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
        console.error("Backend responded with error:", error.response.data);
        Swal.fire({
          title: "Server Error",
          text:
            error.response.data.message ||
            "Something went wrong on the server.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else if (error.request) {
        console.error("No response from backend:", error.request);
        Swal.fire({
          title: "No Response",
          text: "The server did not respond. Please try again later.",
          icon: "warning",
          confirmButtonText: "OK",
        });
      } else {
        console.error("Request error:", error.message);
        Swal.fire({
          title: "Request Error",
          text: "An unexpected error occurred.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  });

  // Remove image button logic
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      const imageBox = e.target.parentElement;
      const imgSrc = imageBox.querySelector("img").src;
      removedImages.push(imgSrc);
      imageBox.remove();
    }
  });

  // Add new image & crop logic
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-image-btn")) {
      currentVariantIndex = e.target.dataset.variant;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.name = `variant_${currentVariantIndex}_images`;
      input.style.display = "none";
      document.body.appendChild(input);
      currentInput = input;

      input.addEventListener("change", () => {
        if (input.files.length) {
          const reader = new FileReader();
          reader.onload = function (event) {
            const cropperModal = document.getElementById("cropperModal");
            const cropperImage = document.getElementById("cropperImage");
            cropperImage.src = event.target.result;
            cropperModal.style.display = "flex";
            cropper = new Cropper(cropperImage, {
              viewMode: 2,
              autoCropArea: 0.95,
              responsive: true,
              background: false,
              zoomable: true,
              cropBoxResizable: true,
            });
          };
          reader.readAsDataURL(input.files[0]);
        }
      });

      input.click();
    }
  });

  document.getElementById("cropCancel").addEventListener("click", () => {
    if (cropper) cropper.destroy();
    document.getElementById("cropperModal").style.display = "none";
    if (currentInput) {
      currentInput.value = "";
    }
  });

  document.getElementById("cropSave").addEventListener("click", () => {
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 4096,
      maxHeight: 4096,
    });
    canvas.toBlob((blob) => {
      const fileName = `cropped-variant-${currentVariantIndex}-${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: "image/jpeg" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);

      currentInput.files = dataTransfer.files;

      const imageBox = document.createElement("div");
      imageBox.classList.add("image-box");

      const img = document.createElement("img");
      img.src = URL.createObjectURL(croppedFile);
      imageBox.appendChild(img);

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-image-btn";
      removeBtn.innerHTML = "&times;";
      imageBox.appendChild(removeBtn);

      imageBox.appendChild(currentInput);

      document
        .getElementById(`image-container-${currentVariantIndex}`)
        .insertBefore(
          imageBox,
          document.querySelector(
            `#image-container-${currentVariantIndex} .add-image-btn`
          )
        );

      cropper.destroy();
      document.getElementById("cropperModal").style.display = "none";
      currentInput = null;
    }, "image/jpeg");
  });
});
