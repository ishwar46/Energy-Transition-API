const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Multer storage configuration for event PDFs
const eventStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/eventPdfs");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, "event-" + Date.now() + ext);
    },
});

// Multer storage configuration for excursion PDFs
const excursionStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/excursionPdfs"); // Store excursion PDFs separately
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, "excursion-" + Date.now() + ext);
    },
});

const eventUpload = multer({ storage: eventStorage });
const excursionUpload = multer({ storage: excursionStorage });

// Create directories if they don't exist
const eventPdfDirectory = path.join(__dirname, "../public/uploads/eventPdfs");
const excursionPdfDirectory = path.join(__dirname, "../public/uploads/excursionPdfs");

if (!fs.existsSync(eventPdfDirectory)) {
    fs.mkdirSync(eventPdfDirectory, { recursive: true });
}

if (!fs.existsSync(excursionPdfDirectory)) {
    fs.mkdirSync(excursionPdfDirectory, { recursive: true });
}

// ---------- Event PDF Routes ----------

// Upload event PDF
router.post("/upload-event-pdf", eventUpload.single("pdf"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Event PDF uploaded successfully",
        filename: req.file.filename,
    });
});

// Get list of event PDFs
router.get("/list-event-pdfs", (req, res) => {
    fs.readdir(eventPdfDirectory, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to list event PDFs" });
        }
        res.status(200).json({ success: true, files });
    });
});

// Delete event PDF
router.delete("/delete-event-pdf/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(eventPdfDirectory, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to delete event PDF" });
        }
        res.status(200).json({ success: true, message: "Event PDF deleted successfully" });
    });
});

// ---------- Excursion PDF Routes ----------

// Upload excursion PDF
router.post("/upload-excursion-pdf", excursionUpload.single("pdf"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "Excursion PDF uploaded successfully",
        filename: req.file.filename,
    });
});

// Get list of excursion PDFs
router.get("/list-excursion-pdfs", (req, res) => {
    fs.readdir(excursionPdfDirectory, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to list excursion PDFs" });
        }
        res.status(200).json({ success: true, files });
    });
});

// Delete excursion PDF
router.delete("/delete-excursion-pdf/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(excursionPdfDirectory, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to delete excursion PDF" });
        }
        res.status(200).json({ success: true, message: "Excursion PDF deleted successfully" });
    });
});

module.exports = router;