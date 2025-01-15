const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  personalInformation: {
    title: { type: String },
    fullName: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String },
    },
    nameOfInstitution: { type: String },
    jobPosition: { type: String },
    mobileNumber: { type: String },
    userPassword: { type: String },
    emailAddress: { type: String },
    gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    plainTextPassword: String,
  },
  profilePicture: {
    uploadDate: { type: Date, default: Date.now },
    fileName: { type: String, default: false },
  },
  biography: { type: String, default: false },
  adminVerification: {
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    adminEmail: { type: String },
    adminRemarks: { type: String },
    verifiedDate: { type: Date },
    verificationRequestDate: { type: Date, default: Date.now },
  },
  isVerifiedByAdmin: { type: Boolean, default: false },
  email: { type: String },
  password: { type: String },
  isAdmin: { type: Boolean, default: false },
  attendance: [
    {
      date: { type: Date, default: Date.now },
      status: { type: Boolean },
    },
  ],
  sessionsAttended: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
  ],
  fcmToken: { type: String },
  conferenceKitReceived: { type: Boolean, default: false },
  meals: [
    {
      type: { type: String },
      date: { type: Date },
      status: { type: Boolean, default: true },
    },
  ],
  excursions: [
    {
      date: { type: Date, default: Date.now },
      status: { type: Boolean, default: false },
    },
  ],
  locationHistory: [
    {
      location: { type: String },
      updatedAt: { type: Date, default: Date.now },
      additionalNotes: { type: String },
    },
  ],
  userUniqueID: { type: Number, required: true, unique: true }
});

const User = mongoose.model("User", userSchema);

module.exports = User;