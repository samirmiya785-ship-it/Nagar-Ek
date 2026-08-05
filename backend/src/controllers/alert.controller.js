const { validationResult } = require("express-validator");
const Alert = require("../models/alert.model");
const User = require("../models/user.model");

const MAX_RADIUS_KM = 15;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const createAlert = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, category, location } = req.body;
  const reporter = req.user._id;

  const userLocation = req.user.location;
  if (!userLocation || !Array.isArray(userLocation.coordinates) || userLocation.coordinates.length !== 2) {
    return res.status(400).json({ message: "User location is required before creating an alert" });
  }

  const [alertLng, alertLat] = location.coordinates;
  const [userLng, userLat] = userLocation.coordinates;
  const distanceKm = getDistanceKm(userLat, userLng, alertLat, alertLng);
  if (distanceKm > MAX_RADIUS_KM) {
    return res.status(400).json({ message: `Alert must be inside a ${MAX_RADIUS_KM}km radius from your location` });
  }

  const rewardPoints = 10;
  const alert = await Alert.create({ title, description, category, location, reporter, rewardPoints, isVisible: true });

  await User.findByIdAndUpdate(reporter, { $inc: { points: rewardPoints } });

  const io = req.app.get("io");
  if (io) io.emit("newAlert", alert);

  res.status(201).json(alert);
};

const getAlerts = async (req, res) => {
  const alerts = await Alert.find({ isVisible: true }).sort({ createdAt: -1 }).populate("reporter", "name");
  res.json(alerts);
};

const getNearbyAlerts = async (req, res) => {
  const userLocation = req.user.location;
  if (!userLocation || !Array.isArray(userLocation.coordinates) || userLocation.coordinates.length !== 2) {
    return res.status(400).json({ message: "User location is required to search nearby alerts" });
  }

  const center = userLocation.coordinates;
  const alerts = await Alert.find({
    isVisible: true,
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: center,
        },
        $maxDistance: MAX_RADIUS_KM * 1000,
      },
    },
  })
    .limit(50)
    .populate("reporter", "name");

  res.json(alerts);
};

const getRecentAlerts = async (req, res) => {
  const recentAlerts = await Alert.find({ isVisible: true }).sort({ createdAt: -1 }).limit(10).populate("reporter", "name");
  res.json(recentAlerts);
};

const updateAlertStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const alert = await Alert.findByIdAndUpdate(id, { status }, { new: true });
  if (!alert) return res.status(404).json({ message: "Alert not found" });
  res.json(alert);
};

module.exports = { createAlert, getAlerts, getNearbyAlerts, getRecentAlerts, updateAlertStatus };
