const mongoose = require("mongoose")

const OnSiteRegisterModel = new mongoose.Schema({
    institution: {
        type: String,
    },
    nationality: {
        type: String,
    },
    title: {
        type: String,
    },
    fullName: {
        type: String,
    },
    jobPosition: {
        type: String
    },
    officeAddress: {
        type: String,
    },
    email: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    onSiteRegisterImage: {
        type: String
    },
    attendance: [{
        date: { type: Date, default: Date.now },
        status: { type: Boolean },
      },],
})


const OnSiteRegister = mongoose.model("onSiteRegisterModel", OnSiteRegisterModel);
module.exports = OnSiteRegister

