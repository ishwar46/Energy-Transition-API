const mongoose = require("mongoose")

const eventWithPdf = new mongoose.Schema({

    day: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: false
    },
    pdf: {
        type: String,
        required: false
    }

}, { timestamps: true })

const EventWithPDF = mongoose.model("EventWithPdf", eventWithPdf)
module.exports = EventWithPDF;