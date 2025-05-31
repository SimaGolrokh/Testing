const asyncHandler = require("express-async-handler");
const {findGardenByUser,insertGarden,updateGardenById,deleteGardenById,} = require("../models/garden");


// Get all gardens for a specific user
const getGardensByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await findGardenByUser(userId);
  res.json(result.rows);
});

// Create a new garden
const createGarden = asyncHandler(async (req, res) => {
  const { user_id, name } = req.body;
  const result = await insertGarden(user_id, name);
  
  res.status(201).json(result.rows[0]);
});

// Update the garden by user
const updateGarden = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;
  const user_id = req.user.id;

  const result = await updateGardenById(body, id, user_id);
  console.log("Result in Controller: ", result);

  if (!result) {
    res.status(404);
    throw new Error("Garden not found");
  }

  res.json(result);
});

// Delete a garden by user
const deleteGarden = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const result = await deleteGardenById(id, user_id);

  if (!result) {
    res.status(404);
    throw new Error("Garden not found");
  }

  res.json({ success: true, message: "Garden deleted successfully" });
});

module.exports = { getGardensByUser, createGarden, updateGarden, deleteGarden };
