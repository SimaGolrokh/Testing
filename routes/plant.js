const express = require("express");
const router = express.Router();
const { 
  getPlants, 
  getPlantById,
  createPlant, 
  updatePlant, 
  deletePlant,
  searchPlants,
  batchUpdateWatered
} = require("../controllers/plant");

// Get all plants
router.get("/plants", getPlants);

// Create a new plant
router.post("/plants", createPlant);

// Search plants by common name
router.get("/plants/search", searchPlants);

router.put("/plants/batch", batchUpdateWatered);

// Get a plant by ID
router.get("/plants/:id", getPlantById);

// Update a plant
router.put("/plants/:id", updatePlant);

// Delete a plant
router.delete("/plants/:id", deletePlant);

module.exports = router;

