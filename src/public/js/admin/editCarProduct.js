document.addEventListener("DOMContentLoaded", () => {
  let cropper;
  let currentInput;
  let currentVariantIndex;
  let removedImages = [];

  // Remove image button - track removed images
  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      const imageBox = e.target.parentElement;
      const imgSrc = imageBox.querySelector("img").src;
      removedImages.push(imgSrc);
      imageBox.remove();
    }
  });

  // Add new image button with cropping
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

  // Cancel cropping
  document.getElementById("cropCancel").addEventListener("click", () => {
    if (cropper) cropper.destroy();
    document.getElementById("cropperModal").style.display = "none";
    if (currentInput) {
      currentInput.value = "";
    }
  });

  // Save cropped image
  document.getElementById("cropSave").addEventListener("click", () => {
    const canvas = cropper.getCroppedCanvas({ width: 320, height: 180 });
    canvas.toBlob((blob) => {
      const fileName = `cropped-variant-${currentVariantIndex}-${Date.now()}.jpg`;
      const croppedFile = new File([blob], fileName, { type: "image/jpeg" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);

      currentInput.files = dataTransfer.files;

      // Add preview box
      const imageBox = document.createElement("div");
      imageBox.classList.add("image-box");

      const img = document.createElement("img");
      img.src = URL.createObjectURL(croppedFile);
      imageBox.appendChild(img);

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-image-btn";
      removeBtn.innerHTML = "&times;";
      imageBox.appendChild(removeBtn);

      // Append hidden input for form submission
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

  // Submit form: append removedImages data to formData
  const editCarProduct = document.getElementById("editCarProduct");
  editCarProduct.addEventListener("submit", async (e) => {
    e.preventDefault();

    const productId = document.querySelector("input[name='product_id']").value;
    const formData = new FormData(editCarProduct);
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
});
