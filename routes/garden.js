const express = require("express");
const router = express.Router();
const { getGardensByUser, createGarden, updateGarden, deleteGarden } = require("../controllers/garden");

// Get all gardens for a user
router.get("/:userId", getGardensByUser);

// Create a new garden
router.post("/", createGarden);

// Update a garden
router.put("/:id", updateGarden);

// Delete a garden
router.delete("/:id", deleteGarden);

module.exports = router;
