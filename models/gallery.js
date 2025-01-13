const mongoose = require("mongoose");
const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
});
const Community = mongoose.model("Gallery", gallerySchema);

module.exports = Community;
