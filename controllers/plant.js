const asyncHandler = require("express-async-handler");
const {getAllCatalogPlants, getCatalogPlantById, searchCatalogPlants, createUserPlant, updateUserPlant, deleteUserPlant, batchUpdatePlants} = require("../models/plant");
const { formatCatalogPlant, formatUserPlant } = require("../utils/plantFormatter");

// Get all catalog plants
const getPlants = asyncHandler(async (req, res) => {
  const result = await getAllCatalogPlants();

  const catalogPlants = result.rows.map(formatCatalogPlant);
  res.json(catalogPlants);
});

// Get a plant by ID
const getPlantById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getCatalogPlantById(id);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Plant not found" });
  }

  const plant = formatCatalogPlant(result.rows[0]);
  res.json(plant);
});


// Search for plants by common name
const searchPlants = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const result = await searchCatalogPlants(query);

  if (!result || !result.rows || result.rows.length === 0) {
    return res.status(404).json({ error: "No plant matches the query."});
  }

  const searchResult = result.rows.map(formatCatalogPlant);
  res.json(searchResult);
});


// Create a new plant for user
const createPlant = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { nickname, plant_id, garden_id } = req.body;

  const createdPlant = await createUserPlant(nickname, plant_id, user_id, garden_id);
  const formattedPlant = formatUserPlant(createdPlant);
  res.json(formattedPlant);
});


// Update a plant for user
const updatePlant = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { updateData } = req.body;
  console.log("request body", updateData)

  const updated = await updateUserPlant(updateData, id, user_id);

  if (!updated) {
    return res.status(404).json({ error: "Plant not found for this user" });
  }

  const formatted = formatUserPlant(updated);
  res.json(formatted);
});

const batchUpdateWatered = asyncHandler(async (req, res) => {
  const { plantIds } = req.body;
  const updated = await batchUpdatePlants(plantIds);

  if (!updated) {
    return res.status(404).json({ error: "Plants not found for this update" });
  }

  const formatted = formatUserPlant(updated)
  return res.status(200).json(formatted)

});



// Delete a plant for user
const deletePlant = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;  // id of the user_plant entry
    const result = await deleteUserPlant(id, user_id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Plant not found for this user" });
    }
    res.json({ success: true, message: "Plant deleted successfully" });
});


module.exports = { getPlants, getPlantById, createPlant, updatePlant, batchUpdateWatered, deletePlant, searchPlants };
