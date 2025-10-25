document.addEventListener("DOMContentLoaded", () => {
  let cropper = null;
  let currentInput = null;
  const cropModalEl = document.getElementById("cropModal");
  const cropModal = bootstrap.Modal.getOrCreateInstance(cropModalEl);
  let variantCount = 1;

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

  // Bind static "Add Image" to create real upload boxes
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

  // Handle file input and cropping workflow
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

  // Initialize Cropper when modal shows
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

  // Confirm cropping and replace file input with cropped image
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

            // Preview
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

            // SAFETY: Remove stuck modal backdrop if needed
            setTimeout(() => {
              document.body.classList.remove("modal-open");
              document
                .querySelectorAll(".modal-backdrop")
                .forEach((el) => el.remove());
            }, 150); // after modal animation finishes
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

  // Cleanup cropper on modal hide
  cropModalEl.addEventListener("hidden.bs.modal", () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    currentInput = null;
    // Remove stuck backdrop if any
    setTimeout(() => {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    }, 150);
  });

  // Remove variant buttons functionality
  document.querySelectorAll(".remove-variant").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      btn.closest(".variant-section").remove();
    });
  });

  // Form submit
  const accessoryForm = document.getElementById("accessoryForm");
  accessoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
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
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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
});
