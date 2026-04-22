const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "../../uploads");
const shopUploads = path.join(uploadRoot, "shops");
const menuUploads = path.join(uploadRoot, "menu-items");

[uploadRoot, shopUploads, menuUploads].forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.originalUrl.includes("/menu/")) {
      cb(null, menuUploads);
      return;
    }

    cb(null, shopUploads);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image uploads are allowed."));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = {
  upload,
};
