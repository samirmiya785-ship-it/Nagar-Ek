const express = require("express");
const { getPointsOfInterest } = require("../controllers/map.controller");

const router = express.Router();
router.get("/poi", getPointsOfInterest);

module.exports = router;
