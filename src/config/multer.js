const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "luxcart_uploads";
    let resourceType = "image";

    if (file.mimetype.startsWith("video/")) {
      folder = "luxcart_videos";
      resourceType = "video";
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "png",
        "jpeg",
        "svg",
        "webp",
        "mp4",
        "mov",
        "avi",
      ],
    };
  },
});

const upload = multer({ storage });
module.exports = upload;
