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

  // Remove image button - track removed images and remove preview
  imageGallery.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      const imageBox = e.target.closest(".image-box");
      if (imageBox.dataset.src) {
        removedImages.push(imageBox.dataset.src);
      }
      imageBox.remove();
    }
  });

  // Add image button - open file picker and initialize cropper
  imageGallery.querySelector(".add-image-btn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.name = "images"; // ADD this so multer can detect files
    input.style.display = "none";
    document.body.appendChild(input);
    currentInput = input;

    input.addEventListener("change", () => {
      if (input.files.length) {
        const reader = new FileReader();
        reader.onload = (event) => {
          cropperImage.src = event.target.result;
          cropperModal.style.display = "flex";

          // Free manual cropping
          cropper = new Cropper(cropperImage, {
            aspectRatio: NaN, // Free cropping
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

  // Cancel cropping - clean up
  cropCancelBtn.addEventListener("click", () => {
    if (cropper) cropper.destroy();
    cropperModal.style.display = "none";

    if (currentInput) {
      currentInput.value = "";
      currentInput.remove();
      currentInput = null;
    }
  });

  // Save cropped image - add new image preview and input inside form
  cropSaveBtn.addEventListener("click", () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 4096,
      maxHeight: 4096,
    });
    canvas.toBlob((blob) => {
      const fileName = `cropped-accessory-${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: "image/jpeg" });

      // Add the cropped file to the currentInput
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      currentInput.files = dataTransfer.files;

      // Append file input inside the form to include on submission
      const form = document.getElementById("editAccessoryForm");
      form.appendChild(currentInput);

      // Create image box preview
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

      // Insert new image box before add button
      imageGallery.insertBefore(
        imageBox,
        imageGallery.querySelector(".add-image-btn")
      );

      cropper.destroy();
      cropperModal.style.display = "none";
      currentInput = null;
    }, "image/jpeg");
  });

  // Submit form - append removed images JSON string
  editAccessoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

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
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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
});
