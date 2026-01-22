const {
  OK,
  INTERNAL_SERVER_ERROR,
  BAD_REQUEST,
} = require("../../constant/statusCode");
const Admin = require("../../models/admin/adminModel");
const cloudinary = require("../../config/cloudinary");
const streamifier = require("streamifier");

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    if (!url) return;

    // Extract public_id from Cloudinary URL
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${fileWithExt.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.log("Error deleting from Cloudinary:", error);
  }
};

// Load Settings Page
const loadSettingPage = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;
    const admin = await Admin.findById(adminId);
    res.status(OK).render("admin/settings", { admin });
  } catch (error) {
    next(error);
  }
};

// Update General Settings
const updateGeneralSettings = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;
    const {
      websiteName,
      email,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      supportEmail,
    } = req.body;

    const updateData = {
      name: websiteName,
      email: email,
      phone: phone,
      supportEmail: supportEmail,
      address: {
        street: street,
        city: city,
        state: state,
        postalCode: postalCode,
        country: country,
      },
    };

    const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    });

    // Update session data
    req.session.admin = admin;

    res.status(OK).json({
      success: true,
      message: "Settings updated successfully",
      admin: admin,
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload and Crop Profile Image
const uploadProfileImage = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;

    if (!req.file) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const admin = await Admin.findById(adminId);

    // Delete old profile image from Cloudinary if exists
    if (admin.profileImage) {
      await deleteFromCloudinary(admin.profileImage, "image");
    }

    // Upload to Cloudinary (file already uploaded by multer-cloudinary middleware)
    const imageUrl = req.file.path; // Cloudinary URL

    // Update database
    admin.profileImage = imageUrl;
    await admin.save();

    req.session.admin = admin;

    res.status(OK).json({
      success: true,
      message: "Profile image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload and Crop Website Logo
const uploadWebsiteLogo = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;

    if (!req.file) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const admin = await Admin.findById(adminId);

    // Delete old logo from Cloudinary if exists
    if (admin.websiteLogo) {
      await deleteFromCloudinary(admin.websiteLogo, "image");
    }

    // Upload to Cloudinary (file already uploaded by multer-cloudinary middleware)
    const logoUrl = req.file.path; // Cloudinary URL

    // Update database
    admin.websiteLogo = logoUrl;
    await admin.save();

    req.session.admin = admin;

    res.status(OK).json({
      success: true,
      message: "Website logo uploaded successfully",
      logoUrl: logoUrl,
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Banner (Image or Video)
const addBanner = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;
    const { title, type } = req.body;

    if (!req.file) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // File already uploaded to Cloudinary by multer middleware
    const fileUrl = req.file.path; // Cloudinary URL

    const admin = await Admin.findById(adminId);
    admin.bannerMedia.push({
      type: type,
      url: fileUrl,
      caption: title,
    });
    await admin.save();

    res.status(OK).json({
      success: true,
      message: "Banner added successfully",
      banner: admin.bannerMedia[admin.bannerMedia.length - 1],
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit Banner
const editBanner = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;
    const { bannerId } = req.params;
    const { title, type } = req.body;

    const admin = await Admin.findById(adminId);
    const banner = admin.bannerMedia.id(bannerId);

    if (!banner) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Update title
    banner.caption = title;

    // If new file uploaded
    if (req.file) {
      // Delete old file from Cloudinary
      const resourceType = banner.type === "video" ? "video" : "image";
      await deleteFromCloudinary(banner.url, resourceType);

      // Update with new file URL (already uploaded by multer middleware)
      banner.url = req.file.path;
      banner.type = type;
    }

    await admin.save();

    res.status(OK).json({
      success: true,
      message: "Banner updated successfully",
      banner: banner,
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Banner
const deleteBanner = async (req, res, next) => {
  try {
    const adminId = req.session.admin._id;
    const { bannerId } = req.params;

    const admin = await Admin.findById(adminId);
    const banner = admin.bannerMedia.id(bannerId);

    if (!banner) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete file from Cloudinary
    const resourceType = banner.type === "video" ? "video" : "image";
    await deleteFromCloudinary(banner.url, resourceType);

    // Remove from database
    banner.deleteOne();
    await admin.save();

    res.status(OK).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  loadSettingPage,
  updateGeneralSettings,
  uploadProfileImage,
  uploadWebsiteLogo,
  addBanner,
  editBanner,
  deleteBanner,
};
