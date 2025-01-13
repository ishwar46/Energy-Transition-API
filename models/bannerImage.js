const mongoose = require("mongoose");

const bannerImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: false },
  description: { type: String, required: false },
});

const BannerImage = mongoose.model("BannerImage", bannerImageSchema);
module.exports = BannerImage;
