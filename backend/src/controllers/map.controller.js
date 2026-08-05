const poiData = [
  { type: "hospital", name: "City General Hospital", coordinates: [77.5946, 12.9716] },
  { type: "police", name: "Central Police Station", coordinates: [77.595, 12.972] },
  { type: "bus_stop", name: "Main Bus Depot", coordinates: [77.5955, 12.973] },
  { type: "education", name: "Greenfield University", coordinates: [77.596, 12.974] },
];

const getPointsOfInterest = (req, res) => {
  const { type } = req.query;
  if (type && typeof type === "string") {
    const filtered = poiData.filter((item) => item.type === type.toLowerCase());
    return res.json(filtered);
  }

  res.json(poiData);
};

module.exports = { getPointsOfInterest };
