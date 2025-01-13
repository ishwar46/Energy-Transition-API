const upload = require("../middleware/multipledocs");
const SiteSchema = require("../models/siteScene");

exports.createSite = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send(`Error uploading files: ${err.message}`);
    }
    const { title, description, address } = req.body;
    const siteImage = req.files.siteimage ? req.files.siteimage[0].path : "";

    try {
      const titleExist = await SiteSchema.find({ title: title });
      if (!titleExist) {
        return res.status(400).send("Title Already Exist");
      }
      const newSite = await SiteSchema({
        title: title,
        description: description,
        address: address,
        siteimage: siteImage,
      });
      await newSite.save();
      res.status(201).json({
        success: true,
        newSite,
        message: "Site created successfully",
      });
    } catch (error) {
      console.log(`Error while Creating Site: ${error}`);
      res.status(500).send("Internal Server Error");
    }
  });
};

exports.getSite = async (req, res) => {
  try {
    const singleSite = await SiteSchema.findById(req.params.id);
    if (!singleSite) {
      return res.status(400).send("No Site Scene Found");
    }
    return res.status(200).json({
      success: true,
      singleSite,
      message: "Site Fetched Successfully",
    });
  } catch (error) {
    console.log(`Error while getting Single Site: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllSite = async (req, res) => {
  try {
    const allSite = await SiteSchema.find();
    if (!allSite) {
      return res.status(400).send("No Site Scene Found");
    }
    return res.status(200).json({
      success: true,
      allSite,
      message: "All Site Fetched Successfully",
    });
  } catch (error) {
    console.log(`Error while getting Site: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteSite = async (req, res) => {
  try {
    const deletedSite = await SiteSchema.findByIdAndDelete(req.params.id);
    if (!deletedSite) {
      return res.status(400).send("No Site Scene Found");
    }
    return res.status(200).json({
      success: true,
      deletedSite,
      message: "Site Deleted Fetched Successfully",
    });
  } catch (error) {
    console.log(`Error while deleting Site: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};
