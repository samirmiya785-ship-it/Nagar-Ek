const { validationResult } = require("express-validator");
const TransportRoute = require("../models/transport.model");

const getRoutes = async (req, res) => {
  const routes = await TransportRoute.find().sort({ updatedAt: -1 });
  res.json(routes);
};

const getRouteById = async (req, res) => {
  const route = await TransportRoute.findById(req.params.id);
  if (!route) return res.status(404).json({ message: "Route not found" });
  res.json(route);
};

const createRoute = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    routeName,
    vehicleType,
    currentLocation,
    nextStop,
    estimatedArrivalMinutes,
    routePath,
  } = req.body;

  const route = await TransportRoute.create({
    routeName,
    vehicleType,
    currentLocation,
    nextStop,
    estimatedArrivalMinutes,
    routePath,
  });

  res.status(201).json(route);
};

const updateRouteLocation = async (req, res) => {
  const { id } = req.params;
  const { currentLocation, nextStop, estimatedArrivalMinutes } = req.body;
  const route = await TransportRoute.findByIdAndUpdate(
    id,
    { currentLocation, nextStop, estimatedArrivalMinutes },
    { new: true }
  );
  if (!route) return res.status(404).json({ message: "Route not found" });
  res.json(route);
};

module.exports = { getRoutes, getRouteById, createRoute, updateRouteLocation };
