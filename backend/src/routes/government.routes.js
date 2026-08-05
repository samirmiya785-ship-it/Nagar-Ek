const express = require("express");
const { searchGovernmentGuide, seedGovernmentGuides } = require("../controllers/government.controller");

const router = express.Router();

router.get("/search", searchGovernmentGuide);
router.post("/seed", seedGovernmentGuides);

module.exports = router;
