const express = require("express");
const { body } = require("express-validator");
const { register, login, logout, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("phone").notEmpty().withMessage("Phone number is required").isMobilePhone("any").withMessage("Valid phone number is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  register,
);

router.post("/login", [body("identifier").notEmpty().withMessage("Username, phone number, or email is required"), body("password").notEmpty().withMessage("Password is required")], login);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

module.exports = router;
