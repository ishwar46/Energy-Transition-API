const mongoose = require("mongoose");
const carouselSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  image: {
    type: String,
  },
});