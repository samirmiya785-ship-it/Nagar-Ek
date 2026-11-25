const mongoose = require("mongoose");

const providedServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  documentsRequired: { type: [String], required: true },
});

const governmentServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    hours: { type: String, required: true },
    mapQuery: { type: String, required: true },
    iconType: { type: String, required: true },
    providedServices: [providedServiceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GovernmentService", governmentServiceSchema);
