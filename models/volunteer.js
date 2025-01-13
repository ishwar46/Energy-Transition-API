const mongoose = require("mongoose")

const volunteerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    volunteerimage: {
        type: String,
        required: false
    },
    isVolunteer: {
        type: Boolean,
        default: true
    }
})

const Volunteer = mongoose.model("Volunteer", volunteerSchema);
module.exports = Volunteer;