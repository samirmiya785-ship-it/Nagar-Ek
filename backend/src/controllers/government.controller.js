const GovernmentGuide = require("../models/government.model");

const sampleGuides = [
  {
    query: "birth certificate",
    department: "Civil Registration",
    documents: ["ID proof", "Birth proof", "Address proof"],
  },
  {
    query: "driver license",
    department: "Regional Transport Office",
    documents: ["ID proof", "Address proof", "Medical certificate"],
  },
  {
    query: "business registration",
    department: "Municipal Corporation",
    documents: ["ID proof", "Address proof", "Business plan"],
  },
  {
    query: "water connection",
    department: "Public Utilities",
    documents: ["ID proof", "Address proof", "Property ownership proof"],
  },
];

const searchGovernmentGuide = async (req, res) => {
  const q = req.query.q;
  if (!q || Array.isArray(q)) return res.status(400).json({ message: "Search query is required" });

  const queryText = q.toLowerCase();
  const guide = await GovernmentGuide.findOne({ query: queryText });
  if (guide) return res.json(guide);

  const fallback = await GovernmentGuide.findOne({ query: { $regex: queryText, $options: "i" } });
  if (fallback) return res.json(fallback);

  res.status(404).json({ message: "No matching government guide found" });
};

const seedGovernmentGuides = async (req, res) => {
  await GovernmentGuide.deleteMany({});
  const guides = await GovernmentGuide.insertMany(sampleGuides);
  res.json({ seeded: guides.length });
};

module.exports = { searchGovernmentGuide, seedGovernmentGuides };
