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
    clone.querySelector(".card-header span").textContent = `Variant #${
      newIndex + 1
    }`;

    // Clear inputs
    clone
      .querySelectorAll("input[type='text'], input[type='number']")
      .forEach((input) => (input.value = ""));

    // Reset dynamic image container
    const imageContainer = clone.querySelector(".variant-images-container");
    imageContainer.innerHTML = `
      <button type="button" class="btn btn-outline-primary btn-sm add-image-btn">
        <i class="bi bi-plus-circle"></i> Add Image
      </button>
    `;

    // Show remove variant button
    clone.querySelector(".remove-variant").classList.remove("d-none");
    clone
      .querySelector(".remove-variant")
      .addEventListener("click", () => clone.remove());

    // Re-bind the Add Image button for this clone
    clone.querySelector(".add-image-btn").addEventListener("click", (e) => {
      addImageBox(e.target.closest(".variant-section"), newIndex);
    });

    container.appendChild(clone);
  });

  // --- Function to add dynamic image upload box ---
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

    // Hover effect
    uploadBox.addEventListener("mouseenter", () => {
      uploadBox.style.background = "#e9ecef";
    });
    uploadBox.addEventListener("mouseleave", () => {
      uploadBox.style.background = "#f8f9fa";
    });

    // Add to DOM
    imageContainer.appendChild(uploadBox);

    // Handle click on upload box
    uploadBox.addEventListener("click", (e) => {
      if (e.target.closest(".remove-image-btn")) return;
      uploadBox.querySelector("input").click();
    });

    // Handle remove image box
    uploadBox
      .querySelector(".remove-image-btn")
      .addEventListener("click", () => {
        uploadBox.remove();
      });
  }

  // --- Handle File Change / Cropping ---
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
        background: false,
        zoomable: true,
        cropBoxResizable: true,
      });
    }
  });

  // --- Confirm Crop ---
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
          imgPreview.style.borderRadius = "8px";
          previewContainer.appendChild(imgPreview);

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
      Swal.fire({
        title: "Saving Car...",
        html: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        "/admin/products-management/add-car-product",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Swal.close();

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
      Swal.close();
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Server error occurred",
      });
    }
  });

  // --- Initialize first "Add Image" button in the first variant ---
  const firstAddImageBtn = document.querySelector(".add-image-btn");
  if (firstAddImageBtn) {
    firstAddImageBtn.addEventListener("click", (e) => {
      addImageBox(e.target.closest(".variant-section"), 0);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  let targetCheckbox = null;

  // When the toggle switch is changed, save the checkbox and show confirmation modal
  document.body.addEventListener("change", (e) => {
    if (e.target.classList.contains("form-check-input")) {
      targetCheckbox = e.target;

      // Revert toggle immediately to preserve old state until confirmed
      e.target.checked = !e.target.checked;

      // Show the confirmation modal using Bootstrap's API
      const confirmListModal = new bootstrap.Modal(
        document.getElementById("confirmListModal")
      );
      confirmListModal.show();
    }
  });

  // On modal show: (optional if you want to do something with the event)
  const confirmListModalEl = document.getElementById("confirmListModal");
  confirmListModalEl.addEventListener("show.bs.modal", (e) => {
    // You can access e.relatedTarget here if needed
  });

  // Confirm button click inside modal - proceed with PATCH request
  document
    .getElementById("confirmListModal")
    .querySelector(".btn-danger")
    .addEventListener("click", async () => {
      if (!targetCheckbox) return;

      const productId = targetCheckbox.dataset.id;
      const newStatus = !targetCheckbox.checked; // Because we reverted state initially

      // Get Bootstrap modal instance to close later
      const confirmModal = bootstrap.Modal.getInstance(confirmListModalEl);

      try {
        // Make PATCH request to update product status
        const res = await axios.patch(
          `/admin/products-management/soft-delete-car-product/${productId}`,
          { listed: newStatus }
        );

        confirmModal.hide();

        if (res.data.success) {
          // Update toggle to new state on success
          targetCheckbox.checked = newStatus;

          Swal.fire({
            icon: "success",
            title: "Product status updated!",
            text: "The product has been successfully updated.",
            timer: 1500,
            showConfirmButton: false,
          }).then(() => window.location.reload());
        } else {
          Swal.fire({
            icon: "error",
            title: "Failed!",
            text: res.data.message || "Failed to update product status.",
          });
        }
      } catch (err) {
        confirmModal.hide();

        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Something went wrong while updating the product status.",
        });
      }
    });

  // Cancel button reverts toggle state back to previous
  document
    .getElementById("confirmListModal")
    .querySelector(".btn-secondary")
    .addEventListener("click", () => {
      if (targetCheckbox) {
        targetCheckbox.checked = !targetCheckbox.checked;
      }
    });
});
