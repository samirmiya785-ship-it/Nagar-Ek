const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["alert", "notification"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    unread: { type: Boolean, default: true },
    category: { type: String },
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
