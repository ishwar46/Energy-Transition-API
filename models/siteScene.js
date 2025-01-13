const mongoose = require("mongoose");

const SiteSceneSchema = mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
  },
  siteimage: {
    type: String,
  },
});

const SiteSchema = mongoose.model("SiteSchema", SiteSceneSchema);
module.exports = SiteSchema;
