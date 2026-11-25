const express = require("express");
const {
  getGovernmentServices,
  getGovernmentServiceById,
  seedGovernmentServices,
} = require("../controllers/government.controller");

const router = express.Router();

router.get("/", getGovernmentServices);
router.get("/:id", getGovernmentServiceById);
router.post("/seed", seedGovernmentServices);

module.exports = router;
