const mongoose = require("mongoose")

const onlyPDF = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    pdf: {
        type: String,
        required: false
    }

}, { timestamps: true })

const OnlyPDF = mongoose.model("OnlyPDF", onlyPDF)
module.exports = OnlyPDF;