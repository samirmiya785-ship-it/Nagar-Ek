const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  createAlert,
  getAlerts,
  getNearbyAlerts,
  getRecentAlerts,
  updateAlertStatus,
  getAlertById,
} = require("../controllers/alert.controller");

const router = express.Router();

router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("location.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Location coordinates are required"),
  ],
  createAlert
);

router.get("/", getAlerts);
router.get("/near", authenticate, getNearbyAlerts);
router.get("/recent", getRecentAlerts);
router.get("/:id", getAlertById);
router.patch("/:id/status", authenticate, updateAlertStatus);

module.exports = router;
