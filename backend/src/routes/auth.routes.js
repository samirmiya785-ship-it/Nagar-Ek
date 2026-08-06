const express = require("express");
const { body } = require("express-validator");
const { register, login, logout, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Please Enter your Name"),
    body("phone").notEmpty().withMessage("Please Enter your Phone Number").isMobilePhone("any").withMessage("Please Enter a Valid Phone Number"),
    body("email").isEmail().withMessage("Please Enter a Valid Email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  register,
);

router.post("/login", [body("identifier").notEmpty().withMessage("  Phone number or email is required"), body("password").notEmpty().withMessage("Password is required")], login);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

module.exports = router;
