// Tab Navigation
document.getElementById("general-tab").addEventListener("click", function () {
  showSection("general-section");
  setActiveTab("general-tab");
});

document.getElementById("branding-tab").addEventListener("click", function () {
  showSection("branding-section");
  setActiveTab("branding-tab");
});

document.getElementById("banner-tab").addEventListener("click", function () {
  showSection("banner-section");
  setActiveTab("banner-tab");
});

function showSection(sectionId) {
  document.querySelectorAll('[id$="-section"]').forEach((section) => {
    section.classList.add("d-none");
  });
  document.getElementById(sectionId).classList.remove("d-none");
}

function setActiveTab(tabId) {
  document.querySelectorAll('[id$="-tab"]').forEach((tab) => {
    tab.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");
}

// General Settings Form
document
  .getElementById("generalSettingsForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/admin/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        showToast("Settings updated successfully!", "success");
      } else {
        showToast("Error: " + result.message, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to update settings", "error");
    }
  });

// Image Cropper Setup
let cropper;
let currentUploadType = null;
let currentFile = null;

function initializeCropper(imageSrc, aspectRatio) {
  const cropperImage = document.getElementById("cropperImage");
  cropperImage.src = imageSrc;

  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(cropperImage, {
    aspectRatio: aspectRatio,
    viewMode: 1,
    autoCropArea: 1,
    responsive: true,
    background: false,
    zoomable: true,
    scalable: true,
    cropBoxResizable: true,
    dragMode: "move",
  });
}

// Profile Image Upload
document.getElementById("profileImageInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      currentUploadType = "profile";
      initializeCropper(event.target.result, 1); // Square aspect ratio
      new bootstrap.Modal(document.getElementById("cropperModal")).show();
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("uploadProfileBtn").addEventListener("click", () => {
  document.getElementById("profileImageInput").click();
});

// Logo Image Upload
document.getElementById("logoImageInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      currentUploadType = "logo";
      initializeCropper(event.target.result, 3 / 1); // 3:1 aspect ratio for logo
      new bootstrap.Modal(document.getElementById("cropperModal")).show();
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("uploadLogoBtn").addEventListener("click", () => {
  document.getElementById("logoImageInput").click();
});

// Crop and Upload Image
document.getElementById("cropImageBtn").addEventListener("click", async () => {
  if (!cropper || !currentFile) return;

  const canvas = cropper.getCroppedCanvas({
    maxWidth: currentUploadType === "profile" ? 400 : 800,
    maxHeight: currentUploadType === "profile" ? 400 : 300,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  canvas.toBlob(
    async (blob) => {
      const formData = new FormData();

      if (currentUploadType === "profile") {
        formData.append("profileImage", blob, currentFile.name);

        try {
          showLoader(true);
          const response = await fetch("/admin/settings/profile-image", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            document.getElementById("currentProfileImage").src =
              result.imageUrl;
            showToast("Profile image updated successfully!", "success");
            bootstrap.Modal.getInstance(
              document.getElementById("cropperModal"),
            ).hide();
          } else {
            showToast("Error: " + result.message, "error");
          }
        } catch (error) {
          console.error("Error:", error);
          showToast("Failed to upload profile image", "error");
        } finally {
          showLoader(false);
        }
      } else if (currentUploadType === "logo") {
        formData.append("websiteLogo", blob, currentFile.name);

        try {
          showLoader(true);
          const response = await fetch("/admin/settings/website-logo", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            document.getElementById("currentLogoImage").src = result.logoUrl;
            showToast("Website logo updated successfully!", "success");
            bootstrap.Modal.getInstance(
              document.getElementById("cropperModal"),
            ).hide();
          } else {
            showToast("Error: " + result.message, "error");
          }
        } catch (error) {
          console.error("Error:", error);
          showToast("Failed to upload logo", "error");
        } finally {
          showLoader(false);
        }
      } else if (currentUploadType === "banner") {
        // For banner upload
        formData.append("bannerFile", blob, currentFile.name);
        formData.append(
          "title",
          document.querySelector('input[name="title"]').value,
        );
        formData.append("type", "image");

        await uploadBanner(formData);
        bootstrap.Modal.getInstance(
          document.getElementById("cropperModal"),
        ).hide();
      } else if (currentUploadType === "editBanner") {
        // For banner edit
        const bannerId = document.getElementById("editBannerId").value;
        formData.append("bannerFile", blob, currentFile.name);
        formData.append(
          "title",
          document.getElementById("editBannerTitle").value,
        );
        formData.append("type", "image");

        await updateBanner(bannerId, formData);
        bootstrap.Modal.getInstance(
          document.getElementById("cropperModal"),
        ).hide();
      }

      // Reset
      currentFile = null;
      currentUploadType = null;
    },
    "image/jpeg",
    0.95,
  );
});

// Banner Management

// Update file input based on type selection
document.getElementById("bannerTypeSelect").addEventListener("change", (e) => {
  const fileInput = document.getElementById("bannerFileInput");
  if (e.target.value === "image") {
    fileInput.accept = "image/*";
  } else {
    fileInput.accept = "video/*";
  }
});

// Add Banner
document
  .getElementById("addBannerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const type = formData.get("type");
    const file = formData.get("bannerFile");

    if (!file || file.size === 0) {
      showToast("Please select a file", "error");
      return;
    }

    if (type === "image") {
      // Show cropper for images
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        currentUploadType = "banner";
        initializeCropper(event.target.result, 3 / 1); // 3:1 aspect ratio for banners

        // Close add banner modal first
        bootstrap.Modal.getInstance(
          document.getElementById("addBannerModal"),
        ).hide();

        // Show cropper modal
        new bootstrap.Modal(document.getElementById("cropperModal")).show();
      };
      reader.readAsDataURL(file);
    } else {
      // Upload video directly
      await uploadBanner(formData);
    }
  });

async function uploadBanner(formData) {
  try {
    showLoader(true);
    const response = await fetch("/admin/settings/banner/add", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      showToast("Banner added successfully!", "success");
      bootstrap.Modal.getInstance(
        document.getElementById("addBannerModal"),
      )?.hide();
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast("Error: " + result.message, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Failed to add banner", "error");
  } finally {
    showLoader(false);
  }
}

// View Banner
document.addEventListener("click", function (e) {
  if (e.target.closest(".view-banner-btn")) {
    const btn = e.target.closest(".view-banner-btn");
    const url = btn.getAttribute("data-url");
    const type = btn.getAttribute("data-type");
    const content = document.getElementById("viewBannerContent");

    if (type === "image") {
      content.innerHTML = `<img src="${url}" class="img-fluid rounded" alt="Banner">`;
    } else {
      content.innerHTML = `<video src="${url}" class="w-100 rounded" controls></video>`;
    }

    new bootstrap.Modal(document.getElementById("viewBannerModal")).show();
  }
});

// Edit Banner
document.addEventListener("click", function (e) {
  if (e.target.closest(".edit-banner-btn")) {
    const btn = e.target.closest(".edit-banner-btn");
    const bannerId = btn.getAttribute("data-banner-id");
    const caption = btn.getAttribute("data-caption");
    const type = btn.getAttribute("data-type");

    document.getElementById("editBannerId").value = bannerId;
    document.getElementById("editBannerTitle").value = caption;
    document.getElementById("editBannerType").value = type;

    new bootstrap.Modal(document.getElementById("editBannerModal")).show();
  }
});

document
  .getElementById("editBannerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bannerId = formData.get("bannerId");
    const file = formData.get("bannerFile");
    const type = formData.get("type");

    if (file && file.size > 0) {
      if (type === "image") {
        // Show cropper for new image
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          currentUploadType = "editBanner";
          initializeCropper(event.target.result, 3 / 1);

          // Close edit modal
          bootstrap.Modal.getInstance(
            document.getElementById("editBannerModal"),
          ).hide();

          // Show cropper
          new bootstrap.Modal(document.getElementById("cropperModal")).show();
        };
        reader.readAsDataURL(file);
      } else {
        await updateBanner(bannerId, formData);
      }
    } else {
      // Only updating title, no new file
      await updateBanner(bannerId, formData);
    }
  });

async function updateBanner(bannerId, formData) {
  try {
    showLoader(true);
    const response = await fetch(`/admin/settings/banner/edit/${bannerId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      showToast("Banner updated successfully!", "success");
      bootstrap.Modal.getInstance(
        document.getElementById("editBannerModal"),
      )?.hide();
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast("Error: " + result.message, "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Failed to update banner", "error");
  } finally {
    showLoader(false);
  }
}

// Delete Banner
let bannerToDelete = null;

document.addEventListener("click", function (e) {
  if (e.target.closest(".delete-banner-btn")) {
    const btn = e.target.closest(".delete-banner-btn");
    bannerToDelete = btn.getAttribute("data-banner-id");
    new bootstrap.Modal(document.getElementById("deleteBannerModal")).show();
  }
});

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    if (!bannerToDelete) return;

    try {
      showLoader(true);
      const response = await fetch(
        `/admin/settings/banner/delete/${bannerToDelete}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();
      if (result.success) {
        showToast("Banner deleted successfully!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("deleteBannerModal"),
        ).hide();
        setTimeout(() => location.reload(), 1500);
      } else {
        showToast("Error: " + result.message, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to delete banner", "error");
    } finally {
      showLoader(false);
    }
  });

// Helper Functions
function showToast(message, type = "info") {
  // Create toast element
  const toastContainer =
    document.getElementById("toastContainer") || createToastContainer();

  const toastId = `toast-${Date.now()}`;
  const bgColor =
    type === "success"
      ? "bg-success"
      : type === "error"
        ? "bg-danger"
        : "bg-info";

  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();

  // Remove after hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "toast-container position-fixed top-0 end-0 p-3";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
  return container;
}

function showLoader(show) {
  let loader = document.getElementById("pageLoader");

  if (show) {
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "pageLoader";
      loader.className =
        "position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
      loader.style.backgroundColor = "rgba(0,0,0,0.5)";
      loader.style.zIndex = "9999";
      loader.innerHTML = `
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
      `;
      document.body.appendChild(loader);
    }
    loader.style.display = "flex";
  } else {
    if (loader) {
      loader.style.display = "none";
    }
  }
}
