const express = require("express");
const router = express.Router();
const { getUserProfile, createUserProfile, updateUserProfile, getUserPlants, getUserGardens } = require("../controllers/user");

// Get User Profile
router.get("/user/:id", getUserProfile);

// Create User Profile
router.post("/", createUserProfile);

// Update User Profile
router.put("/", updateUserProfile);

// Get all plants of a user
router.get("/plants", getUserPlants);

// Get all gardens of a user
router.get("/gardens", getUserGardens);

module.exports = router
