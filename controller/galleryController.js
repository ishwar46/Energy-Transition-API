const Gallery = require("../models/gallery");
const upload = require("../middleware/uploads");
const fs = require("fs");

const createGallery = async(req, res) => {
    try {
        upload(req, res, async(err) => {
            if (err) {
                return res.status(400).send({
                    success: false,
                    message: "Error uploading image.",
                    error: err.message,
                });
            }

            const { title, description } = req.body;
            if (!title || !description) {
                return res.status(400).send({
                    success: false,
                    message: "Title and Description are required.",
                });
            }
            if (!req.file) {
                return res.status(400).send({
                    success: false,
                    message: "No file uploaded.",
                });
            }

            // Check if the title already exists
            const existingGallery = await Gallery.findOne({ title });
            if (existingGallery) {
                // Delete the uploaded image if the title already exists
                fs.unlinkSync(req.file.path);
                return res.status(400).send({
                    success: false,
                    message: "A gallery with this title already exists. Image not saved.",
                });
            }

            const newGallery = new Gallery({
                title,
                description,
                image: req.file.path,
            });
            await newGallery.save();

            return res.status(200).send({
                success: true,
                message: "Gallery added successfully",
                gallery: newGallery,
            });
        });
    } catch (error) {
        console.error("Error creating gallery:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const getGalleryById = async(req, res) => {
    try {
        const { id } = req.params;
        const gallery = await Gallery.findById(id);
        if (!gallery) {
            return res
                .status(404)
                .send({ success: false, message: "Gallery not found." });
        }
        res.status(200).send({ success: true, gallery });
    } catch (error) {
        console.error("Error fetching gallery by ID:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request. Please try again later in few minutes.",
        });
    }
};

const getAllGalleries = async(req, res) => {
    try {
        const gallery = await Gallery.find();
        res.status(200).send({ success: true, gallery });
    } catch (error) {
        console.error("Error fetching all galleries:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const deleteGalleryById = async(req, res) => {
    try {
        const { id } = req.params;
        const deletedGallery = await Gallery.findByIdAndDelete(id);
        if (!deletedGallery) {
            return res
                .status(404)
                .send({ success: false, message: "Gallery not found." });
        }

        // Remove image file from upload folder
        fs.unlinkSync(deletedGallery.image);

        res.status(200).send({
            success: true,
            message: "Gallery deleted successfully",
            gallery: deletedGallery,
        });
    } catch (error) {
        console.error("Error deleting gallery by ID:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

const updateGalleryById = async(req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        upload(req, res, async(err) => {
            if (err) {
                return res.status(400).send({
                    success: false,
                    message: "Error uploading image.",
                    error: err.message,
                });
            }

            // Find the gallery by ID
            const gallery = await Gallery.findById(id);
            if (!gallery) {
                return res
                    .status(404)
                    .send({ success: false, message: "Gallery not found." });
            }

            // Update the gallery details
            gallery.title = title;
            gallery.description = description;

            // Update the image path if a new image is uploaded
            if (req.file) {
                fs.unlinkSync(gallery.image); // Remove the old image
                gallery.image = req.file.path;
            }

            await gallery.save();

            res.status(200).send({
                success: true,
                message: "Gallery updated successfully",
                gallery,
            });
        });
    } catch (error) {
        console.error("Error updating gallery by ID:", error);
        res.status(500).send({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
};

module.exports = {
    createGallery,
    getGalleryById,
    getAllGalleries,
    deleteGalleryById,
    updateGalleryById,
};