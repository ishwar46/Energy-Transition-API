const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OnlyPDF = require("../models/onlyPDF");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/pdf1")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + Date.now() + ext);
    }
})

const uploadPDF = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }
});


const createEventWithPdfAndTitle = async (req, res) => {
    const { title } = req.body;
    console.log(req.body)
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        })
    }

    try {
        let pdfPath = "";
        if (req.file) {
            pdfPath = req.file.path
        }
        const onlyPDf = new OnlyPDF({
            title,
            pdf: pdfPath
        });
        const savedOnlyPDF = await onlyPDf.save();

        return res.status(200).json({
            success: true,
            savedOnlyPDF,
            message: "Event Created Successfully"
        })
    } catch (error) {
        console.log(`Error while creating PDF is ${error}`)
        return res.status(500).send("Internal Server Error")
    }

}

const getAllEventWithPdfAndTitle = async (req, res) => {
    try {
        const allPdfwithtitle = await OnlyPDF.find();
        if (!allPdfwithtitle) {
            return res.status(400).send("No Event With PDF Found")
        }
        return res.status(200).json({
            success: true,
            allPdfwithtitle,
            message: "All Event With PDF Fetched Successfully"
        })
    } catch (error) {
        console.log(`Error while getting pdf is ${error}`)
        return res.status(500).send("Internal Server Error")
    }
}

const deleteEventWithPdfAndTitle = async (req, res) => {
    try {
        const deletePDF = await OnlyPDF.findByIdAndDelete(req.params.id)
        if (!deletePDF) {
            return res.status(400).send("Unable to find ID")
        }
        fs.unlinkSync(deletePDF.pdf)
        return res.status(200).json({
            success: true,
            deletePDF,
            message: "Event with Title Deleted Successfully"
        })
    } catch (error) {
        console.log(`Error while Deleting PDF is ${error}`)
        return res.status(500).send("Internal Server Error")

    }
}

const editEventWithPdfandTitle = async (req, res) => {
    const { title } = req.body;
    const { id } = req.params;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required"
        });
    }

    console.log(req.body)

    try {
        const existingEvent = await OnlyPDF.findById(id);
        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }
        existingEvent.title = title;

        if (req.file) {
            if (existingEvent.pdf) {
                const pdfPath = path.resolve(existingEvent.pdf)
                if (fs.existsSync(pdfPath)) {

                    fs.unlinkSync(pdfPath);
                }
            }
            existingEvent.pdf = req.file.path;
        }

        const updatedEvent = await existingEvent.save();

        return res.status(200).json({
            success: true,
            updatedEvent,
            message: "Event updated successfully"
        });
    } catch (error) {
        console.log(`Error while updating PDF is ${error}`);
        return res.status(500).send("Internal Server Error");
    }
}


module.exports = {
    createEventWithPdfAndTitle,
    getAllEventWithPdfAndTitle,
    deleteEventWithPdfAndTitle,
    editEventWithPdfandTitle,
    uploadPDF
}