const multer = require("multer");
const fs = require("fs");
const path = require("path");
const EventWithPDF = require("../models/eventWithPdf");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/eventPdfs")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + Date.now() + ext);
    }
})

const uploadEvent = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }
});


const createEventWithPdf = async (req, res) => {
    const { day, date, title } = req.body;
    if (!day || !date) {
        return res.status(400).send("Day and Date are required")
    }

    try {
        let pdfPath = "";
        if (req.file) {
            pdfPath = req.file.path
        }
        const newEvent = new EventWithPDF({
            day,
            date,
            title,
            pdf: pdfPath
        });
        const savedEvent = await newEvent.save();

        return res.status(200).json({
            success: true,
            savedEvent,
            message: "Event Created Successfully"
        })
    } catch (error) {
        console.log(`Error while create Event is ${error}`)
        return res.status(500).send("Internal Server Error")
    }

}

const getAllEventWithPdf = async (req, res) => {
    try {
        const allEventWithPDF = await EventWithPDF.find();
        if (!allEventWithPDF) {
            return res.status(400).send("No Event With PDF Found")
        }
        return res.status(200).json({
            success: true,
            allEventWithPDF,
            message: "All Event With PDF Fetched Successfully"
        })
    } catch (error) {
        console.log(`Error while getting Event is ${error}`)
        return res.status(500).send("Internal Server Error")
    }
}

const deleteEventWithPdf = async (req, res) => {
    try {
        const deleteEvent = await EventWithPDF.findByIdAndDelete(req.params.id)
        if (!deleteEvent) {
            return res.status(400).send("Unable to find ID")
        }
        return res.status(200).json({
            success: true,
            deleteEvent,
            message: "Event Deleted Successfully"
        })
    } catch (error) {
        console.log(`Error while Deleting Event is ${error}`)
        return res.status(500).send("Internal Server Error")

    }
}

const editEventWithPdf = async (req, res) => {
    try {
        const { id } = req.params;

        const existentEventWithDay = await EventWithPDF.findById(id);
        if (!existentEventWithDay) {
            return res.status(400).json({
                success: false,
                message: "Event With ID Not Found"
            });
        }

        const updateData = {
            day: req.body.day || existentEventWithDay.day,
            date: req.body.date || existentEventWithDay.date,
            title: req.body.title || existentEventWithDay.title,
        };

        if (req.file) {
            if (existentEventWithDay.pdf) {
                fs.unlinkSync(existentEventWithDay.pdf);
            }
            updateData.pdf = req.file.path;
        }
        const updateEventWithDay = await EventWithPDF.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(200).json({
            success: true,
            updateEventWithDay,
            message: "Event With Day Updated Successfully"
        });

    } catch (error) {
        console.log(`Error while updating event: ${error}`);
        return res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    createEventWithPdf,
    getAllEventWithPdf,
    deleteEventWithPdf,
    deleteEventWithPdf,
    editEventWithPdf,
    uploadEvent
}