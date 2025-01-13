const path = require("path");
const upload = require("../middleware/multipledocs");
const Venue = require("../models/venue");
const fs = require("fs");

const createVenue = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "Error uploading file.",
          error: err.message,
        });
      }
      if (!req.files) {
        return res.status(400).send({
          success: false,
          message: "file path missing.",
        });
      }
      const venueImages = req.files.venueimage
        ? req.files.venueimage.map((file) => file.path.replace(/\\/g, "/"))
        : [];

      const { title, description, address, phone, webLink } = req.body;
      const venueData = new Venue({
        title,
        description,
        address,
        phone,
        webLink,
        venueimage: venueImages || "",
      });

      const savedVenue = await venueData.save();
      return res.status(201).json({
        success: true,
        message: "Venue created successfully.",
        data: savedVenue,
      });
    });
  } catch (error) {
    console.error(`Error while creating venue: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

const getAllVenue = async (req, res) => {
  try {
    const allVenue = await Venue.find();
    if (!allVenue) {
      return res.status(400).send("No Venue Found");
    }
    return res.status(200).json({
      success: true,
      allVenue,
      message: "All Venue fetched Successfully",
    });
  } catch (error) {
    console.error(`Error while getting venue: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

const deleteVenueById = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(400).send("No Venue Found");
    }
    if (venue.venueimage && Array.isArray(venue.venueimage)) {
      venue.venueimage.forEach((file) => {
        if (file) {
          const filePath = path.resolve(file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
    return res.status(200).json({
      success: true,
      venue,
      message: "Venue deleted Successfully",
    });
  } catch (error) {
    console.error(`Error while deleting venue: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

const updateVenueById = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "Error uploading file.",
          error: err.message,
        });
      }
      const venueId = req.params.id;
      const venue = await Venue.findById(venueId);
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: "Venue not found",
        });
      }
      if (
        req.files.venueimage &&
        venue.venueimage &&
        Array.isArray(venue.venueimage)
      ) {
        venue.venueimage.forEach((file) => {
          const filePath = path.resolve(file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      const venueImages = req.files.venueimage
        ? req.files.venueimage.map((file) => file.path.replace(/\\/g, "/"))
        : venue.venueimage;
      const { title, description, address, phone, webLink } = req.body;
      venue.title = title || venue.title;
      venue.description = description || venue.description;
      venue.address = address || venue.address;
      venue.phone = phone || venue.phone;
      venue.webLink = webLink || venue.webLink;
      venue.venueimage = venueImages || venue.venueimage;

      const updatedVenue = await venue.save();
      return res.status(200).json({
        success: true,
        message: "Venue updated successfully.",
        data: updatedVenue,
      });
    });
  } catch (error) {
    console.error(`Error while Updating venue: ${error}`);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createVenue,
  getAllVenue,
  deleteVenueById,
  updateVenueById,
};
