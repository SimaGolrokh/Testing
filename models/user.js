const pool = require("../config/db");

const findUserById = (id) => {
  return pool.query("SELECT * FROM app_user WHERE id = $1", [id]);
};

const createUser = (username, email) => {
  return pool.query(
    "INSERT INTO app_user (username, email) VALUES ($1, $2) RETURNING *",
    [username, email]
  );
};

const updateUser = (username, email, id) => {
  return pool.query(
    "UPDATE app_user SET username = $1, email = $2 WHERE id = $3 RETURNING *",
    [username, email, id]
  );
};

const findGardensByUser = (userId) => {
  return pool.query("SELECT * FROM garden WHERE user_id = $1", [userId]);
};

module.exports = {
  findUserById,
  createUser,
  updateUser,
  findGardensByUser,
};
