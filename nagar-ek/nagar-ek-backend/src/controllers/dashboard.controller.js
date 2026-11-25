const Alert = require("../models/alert.model");
const TransportRoute = require("../models/transport.model");
const User = require("../models/user.model");

const getDashboard = async (req, res) => {
  const totalAlerts = await Alert.countDocuments();
  const pending = await Alert.countDocuments({ status: "pending" });
  const inProgress = await Alert.countDocuments({ status: "in_progress" });
  const resolved = await Alert.countDocuments({ status: "resolved" });
  const totalRoutes = await TransportRoute.countDocuments();
  const users = await User.countDocuments();

  const progressPercentage =
    totalAlerts === 0
      ? 0
      : Math.round(((resolved + inProgress) / totalAlerts) * 100);

  res.json({
    totalAlerts,
    pending,
    inProgress,
    resolved,
    totalRoutes,
    users,
    workCompletionPercentage: progressPercentage,
    activeRewards: [
      { title: "Movie ticket voucher", points: 100 },
      { title: "Restaurant discount", points: 50 },
      { title: "City transit pass", points: 75 },
    ],
  });
};

module.exports = { getDashboard };
