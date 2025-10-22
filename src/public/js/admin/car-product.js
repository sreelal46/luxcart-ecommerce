document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("variantSectionContainer");
  const addVariantBtn = document.getElementById("addVariantBtn");
  const cropModalEl = document.getElementById("cropModal");
  const cropModal = new bootstrap.Modal(cropModalEl);
  let cropper;
  let currentInput;

  // --- Add Variant ---
  addVariantBtn.addEventListener("click", () => {
    const variants = container.querySelectorAll(".variant-section");
    const newIndex = variants.length;

    const clone = variants[0].cloneNode(true);

    // Update header
    clone.querySelector(".card-header span").textContent = `Variant #${
      newIndex + 1
    }`;

    // Clear inputs
    clone
      .querySelectorAll("input[type='text'], input[type='number']")
      .forEach((input) => (input.value = ""));

    // Change file input names for this variant
    clone.querySelectorAll('input[type="file"]').forEach((fileInput, index) => {
      fileInput.name = `variant_images_${newIndex}[]`;
    });

    // Clear image previews
    clone
      .querySelectorAll(".image-preview")
      .forEach((preview) => (preview.innerHTML = ""));

    // Show remove button
    clone.querySelector(".remove-variant").classList.remove("d-none");

    // Add remove handler
    clone
      .querySelector(".remove-variant")
      .addEventListener("click", () => clone.remove());

    container.appendChild(clone);
  });

  // --- File Change / Crop Trigger ---
  document.addEventListener("change", (e) => {
    if (e.target.matches("input[type='file'][name^='variant_images']")) {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match("image.*")) {
        alert("Please select an image file");
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

  // --- Initialize Cropper when modal shown ---
  cropModalEl.addEventListener("shown.bs.modal", () => {
    if (!cropper && currentInput) {
      const img = document.getElementById("cropImage");
      cropper = new Cropper(img, {
        viewMode: 2,
        autoCropArea: 0.95,
        responsive: true,
        restore: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        background: false,
        modal: true,
        guides: true,
        zoomable: true,
        zoomOnWheel: true,
        wheelZoomRatio: 0.1,
      });
    }
  });

  // --- Crop Confirm ---
  document.getElementById("cropConfirm").addEventListener("click", () => {
    if (!cropper || !currentInput) return;

    const btn = document.getElementById("cropConfirm");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    setTimeout(() => {
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
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

          // Show preview
          const previewContainer = currentInput
            .closest(".upload-box")
            .querySelector(".image-preview");
          previewContainer.innerHTML = "";
          const imgPreview = document.createElement("img");
          imgPreview.src = URL.createObjectURL(newFile);
          imgPreview.style.width = "100%";
          imgPreview.style.height = "auto";
          imgPreview.style.objectFit = "cover";
          imgPreview.style.borderRadius = "8px";
          imgPreview.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          previewContainer.appendChild(imgPreview);

          // Cleanup
          cropper.destroy();
          cropper = null;
          currentInput = null;

          btn.disabled = false;
          btn.innerHTML = originalText;
          cropModal.hide();
        },
        "image/jpeg",
        0.95
      );
    }, 100);
  });

  // --- Cleanup on modal close ---
  cropModalEl.addEventListener("hidden.bs.modal", () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    currentInput = null;
  });

  // --- Form Submit ---
  const carProductForm = document.getElementById("carProductForm");
  carProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(carProductForm);

    try {
      // Show a loading modal
      Swal.fire({
        title: "Saving Car...",
        html: "Please wait",
        allowOutsideClick: false, // prevent clicking outside
        didOpen: () => {
          Swal.showLoading(); // show loading spinner
        },
      });

      const res = await axios.post(
        "/admin/products-management/add-car-product",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Swal.close(); // close the loading modal

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Car Added Successfully",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = res.data.redirect;
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Add Car",
          text: res.data.message || "Something went wrong!",
        });
      }
    } catch (error) {
      Swal.close(); // close loading modal
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Server error occurred",
      });
    }
  });
});
