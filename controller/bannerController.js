const BannerImage = require("../models/bannerImage");
const express = require("express");
const path = require("path");
const app = express();

// app.use("/public", express.static(path.join(__dirname, "public")));

exports.addBannerImage = async (req, res) => {
  const { title, description } = req.body;
  const imageUrl = req.files["bannerimage"][0].path;

  try {
    const bannerImage = new BannerImage({ url: imageUrl, title, description });
    await bannerImage.save();
    res.status(201).json({ success: true, banner: bannerImage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBannerImages = async (req, res) => {
  try {
    const bannerImages = await BannerImage.find();
    res.status(200).json({ success: true, banners: bannerImages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBannerImage = async (req, res) => {
  const { id } = req.params;

  try {
    await BannerImage.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Banner image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
