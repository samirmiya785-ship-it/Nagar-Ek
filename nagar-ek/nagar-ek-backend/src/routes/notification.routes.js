const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", authenticate, getUserNotifications);
router.patch("/:id/read", authenticate, markAsRead);
router.post("/read-all", authenticate, markAllAsRead);
router.delete("/:id", authenticate, deleteNotification);

module.exports = router;
