const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const alertRoutes = require("./routes/alert.routes");
const governmentRoutes = require("./routes/government.routes");
const transportRoutes = require("./routes/transport.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const mapRoutes = require("./routes/map.routes");
const aiRoutes = require("./routes/ai.routes");
const docsRoutes = require("./routes/docs.routes");
const notificationRoutes = require("./routes/notification.routes");
const { errorHandler } = require("./middlewares/error.middleware");

const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(morgan("dev"));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/government", governmentRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;
