const mongoose = require("mongoose")

const venueSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    address: {
        type: String
    },
    phone: {
        type: String
    },
    webLink: {
        type: String
    },
    venueimage: {
        type: [String],
    }
})

const Venue = mongoose.model("Venue", venueSchema);
module.exports = Venue;