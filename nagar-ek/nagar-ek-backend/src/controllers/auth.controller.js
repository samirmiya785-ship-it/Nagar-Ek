const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, email, password, location } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    return res.status(400).json({ message: "Phone or email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    phone,
    email,
    password: hashedPassword,
    points: 0,
    location: location || null,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "30d",
  });

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      points: user.points,
      location: user.location,
    },
    token,
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
    expiresIn: "7d",
  });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      points: user.points,
      location: user.location,
    },
    token,
  });
};

const logout = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (token) {
    req.blacklistedTokens.add(token);
  }
  res.json({ message: "Logged out successfully" });
};

const updateLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { location } = req.body;
  const updated = await User.findByIdAndUpdate(req.user._id, { location }, { new: true }).select(
    "-password"
  );
  res.json(updated);
};

const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, logout, updateLocation, me };
