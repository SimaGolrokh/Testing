const pool = require("../config/db");

// Find all gardens by user ID
const findGardenByUser = (userId) => {
  return pool.query("SELECT * FROM garden WHERE user_id = $1", [userId]);
};

// Create a new garden
const insertGarden = (userId, name) => {
  return pool.query(
    "INSERT INTO garden (user_id, name) VALUES ($1, $2) RETURNING *",
    [userId, name]
  );
};

// Update a garden
const updateGardenById = async (fieldsToUpdate, id, user_id) => {
  const allowedFields = ["name", "location"];
  const values = [];
  const setClauses = [];
  let index = 1;

  for (const field of allowedFields) {
    if (fieldsToUpdate[field] !== undefined && fieldsToUpdate[field] !== "" && fieldsToUpdate[field] !== null) {
      setClauses.push(`${field} = $${index}`);
      values.push(fieldsToUpdate[field]);
      index++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error("No valid fields provided for update");
  }

  values.push(id, user_id);

  const query = `
    UPDATE garden
    SET ${setClauses.join(", ")}
    WHERE id = $${index} AND user_id = $${index + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};


// Delete a garden
const deleteGardenById = async (id, userId) => {
  return await pool.query(
    "DELETE FROM garden WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, userId]
  );
};

module.exports = {
  findGardenByUser,
  insertGarden,
  updateGardenById,
  deleteGardenById,
};
