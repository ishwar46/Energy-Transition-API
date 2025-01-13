const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const busSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Volunteer",
  }],
  color: {
    type: String,
    required: true,
  },
  busNumber: {
    type: String,
    required: true,
  },
  allocatedParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  allocatedParticipantsAccompany: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accompanyingPersonInfo: {
      firstName: String,
      middleName: String,
      lastName: String,
    },
  }],
});

module.exports = mongoose.model("Bus", busSchema);