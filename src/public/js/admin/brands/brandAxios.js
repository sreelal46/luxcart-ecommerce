let cropper;
let croppedBlob;

// initialize cropper when image selected
document
  .getElementById("brandImageInput")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.getElementById("brandPreview");
      img.src = event.target.result;
      img.style.display = "block";

      if (cropper) cropper.destroy();
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
      });

      document.getElementById("cropImageBtn").style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  });

// crop the selected image
document.getElementById("cropImageBtn").addEventListener("click", function () {
  if (cropper) {
    cropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob((blob) => {
      croppedBlob = blob;
      alert("Image cropped successfully!");
    });
  }
});

// send form data to backend
document
  .getElementById("addBrandForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    if (croppedBlob) {
      formData.append("image", croppedBlob, "brandLogo.jpg");
    }

    try {
      const res = await axios.post("/admin/brands/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        window.location.reload();
      } else {
        alert(res.data.message || "Error adding brand");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
