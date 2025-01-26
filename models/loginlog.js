const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    isSuccess: { type: Boolean, required: true },
    ip: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const LoginLog = mongoose.model("LoginLog", loginLogSchema);
module.exports = LoginLog;
