const asyncHandler = require("express-async-handler");
const {findUserById,createUser,updateUser,findGardensByUser} = require("../models/user");
const {findPlantsByUser} = require("../models/plant");
const { formatUserPlant } = require("../utils/plantFormatter");


// Get User Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await findUserById(id);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(result.rows[0]);
});

// Create User Profile
const createUserProfile = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const result = await createUser(username, email);
  res.json(result.rows[0]);
});

// Update User Profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;
  const result = await updateUser(username, email, userId);
  res.json(result.rows[0]);
});

// Get all plants for a user
const getUserPlants = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await findPlantsByUser(userId);
  const userPlants = result.rows.map(formatUserPlant);
  res.json(userPlants);
});

// Get all gardens for a user
const getUserGardens = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await findGardensByUser(userId);
  res.json(result.rows);
});

module.exports = {getUserProfile,createUserProfile,updateUserProfile, getUserPlants, getUserGardens};
