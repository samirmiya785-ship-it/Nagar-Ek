const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true },
    vehicleType: { type: String, required: true },
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    nextStop: { type: String, required: true },
    estimatedArrivalMinutes: { type: Number, required: true },
    routePath: {
      type: { type: String, enum: ["LineString"], default: "LineString" },
      coordinates: { type: [[Number]], required: true },
    },
  },
  { timestamps: true }
);

transportSchema.index({ currentLocation: "2dsphere" });

module.exports = mongoose.model("TransportRoute", transportSchema);
