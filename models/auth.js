const pool = require("../config/db");

// Check if user exists by email
const findUserByEmail = (email) => {
  return pool.query("SELECT * FROM app_user WHERE email = $1", [email]);
};

// Create a new user
const createUser = (email, hashedPassword, username) => {
  return pool.query(
    "INSERT INTO app_user (email, password, username) VALUES ($1, $2, $3) RETURNING *",
    [email, hashedPassword, username]
  );
};

module.exports = {
  findUserByEmail,
  createUser,
};
