const express = require("express");
const { getPlaces, storePlaces } = require("../controllers/map.controller");

const router = express.Router();

router.get("/places", getPlaces);
router.post("/places", storePlaces);

module.exports = router;
