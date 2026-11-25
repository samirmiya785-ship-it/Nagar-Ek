const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rewardPoints: { type: Number, default: 10 },
    isVisible: { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

alertSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Alert", alertSchema);
