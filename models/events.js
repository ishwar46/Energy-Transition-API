const mongoose = require("mongoose");

const EventDetailSchema = new mongoose.Schema({
  subtitle: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, default: "" },
  description: { type: String, default: "" },
  icon: { type: String, required: true },
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  details: [EventDetailSchema],
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
