const mongoose = require("mongoose");

const governmentGuideSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    documents: { type: [String], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GovernmentGuide", governmentGuideSchema);
