const mongoose = require("mongoose");

const speakerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    institution: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false,
    },
    session: {
        type: String,
        required: false,
    },
    sessionTime: {
        type: String,
        required: false,
    },
    session2: {
        type: String,
        required: false,
    },
    sessionTime2: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    biography: {
        type: String,
        required: true,
    },
    isSpeaker: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Speaker", speakerSchema);