const express = require("express");
const {
  addBannerImage,
  getBannerImages,
  deleteBannerImage,
} = require("../controller/bannerController");
const upload = require("../middleware/multipledocs");

const router = express.Router();

router.post(
  "/addBannerImage",
  upload, // Use the `upload` middleware directly
  addBannerImage
);
router.get("/getBannerImages", getBannerImages);
router.delete("/deleteBannerImage/:id", deleteBannerImage);

module.exports = router;
