const express = require("express");
const router = express.Router();

// Placeholder AI route
router.get("/status", (req, res) => {
  res.json({ message: "AI service route is available." });
});

module.exports = router;
