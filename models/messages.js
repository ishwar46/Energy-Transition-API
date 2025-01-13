const mongoose = require("mongoose");
const messagesSchema = mongoose.Schema({
  msgFrom: {
    type: String,
    required: false,
  },
  msgTitle: {
    type: String,
  },
  msgGreeting: {
    type: String,
  },
  msgDescription: {
    type: String,
  },
  msgEndingRemarks: {
    type: String,
  },
  author1: {
    author1fullName: {
      type: String,
    },
    author1description: {
      type: String,
    },
    author1signature: {
      type: String,
      required: false,
    },
    author1image: {
      type: String,
      required: false,
    },
  },
  author2: {
    author2fullName: {
      type: String,
    },
    author2description: {
      type: String,
    },
    author2signature: {
      type: String,
      required: false,
    },
    author2image: {
      type: String,
      required: false,
    },
  },
});

const Messages = mongoose.model("Messages", messagesSchema);
module.exports = Messages;
