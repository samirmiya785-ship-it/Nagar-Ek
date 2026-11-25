const Place = require("../models/place.model");

// GET /api/map/places - Fetch cached places from database
const getPlaces = async (req, res, next) => {
  try {
    const { lat, lng, radius = 15000 } = req.query;

    if (!lat || !lng) {
      // If no coordinates provided, return all stored places
      const places = await Place.find({});
      return res.status(200).json(places);
    }

    // Convert coordinates to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radMeters = parseFloat(radius);

    // Fetch places within radius
    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radMeters,
        },
      },
    });

    res.status(200).json(places);
  } catch (error) {
    next(error);
  }
};

// POST /api/map/places - Save new places fetched from Overpass API
const storePlaces = async (req, res, next) => {
  try {
    const { places } = req.body; // Expecting array of { name, category, lat, lng }

    if (!Array.isArray(places)) {
      return res.status(400).json({ message: "Places must be an array" });
    }

    const savedPlaces = [];

    for (const place of places) {
      const { name, category, lat, lng } = place;
      if (!name || !category || lat == null || lng == null) continue;

      // Check if place already exists within ~10 meters range to prevent duplicates
      const existing = await Place.findOne({
        name,
        category,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 10, // 10 meters tolerance
          },
        },
      });

      if (!existing) {
        const newPlace = await Place.create({
          name,
          category,
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        });
        savedPlaces.push(newPlace);
      }
    }

    res.status(201).json({
      message: `${savedPlaces.length} new places stored successfully`,
      count: savedPlaces.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlaces, storePlaces };
