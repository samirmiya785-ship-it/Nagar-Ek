const express = require("express");
const { body } = require("express-validator");
const {
  getRoutes,
  getRouteById,
  createRoute,
  updateRouteLocation,
} = require("../controllers/transport.controller");

const router = express.Router();

router.get("/", getRoutes);
router.get("/:id", getRouteById);

router.post(
  "/",
  [
    body("routeName").notEmpty().withMessage("Route name is required"),
    body("vehicleType").notEmpty().withMessage("Vehicle type is required"),
    body("currentLocation.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Current location coordinates are required"),
    body("nextStop").notEmpty().withMessage("Next stop is required"),
    body("estimatedArrivalMinutes")
      .isNumeric()
      .withMessage("Estimated arrival time is required"),
    body("routePath.coordinates")
      .isArray({ min: 2 })
      .withMessage("Route path coordinates are required"),
  ],
  createRoute
);

router.patch("/:id/location", updateRouteLocation);

module.exports = router;
