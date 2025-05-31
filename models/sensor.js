const pool = require("../config/db");

exports.findAllSensors = (userId) => {
  return pool.query(
    `SELECT s.*, up.id AS plant_id, up.nickname 
     FROM moisture_sensor s
     LEFT JOIN user_plant up ON s.id = up.moisture_sensor_id
     WHERE s.user_id = $1`,
    [userId]
  );
};

exports.findSensorByIdWithPlant = (sensorId, userId) => {
  return pool.query(
    `SELECT s.*, up.id AS plant_id, up.nickname
     FROM moisture_sensor s
     LEFT JOIN user_plant up ON s.id = up.moisture_sensor_id
     WHERE s.id = $1 AND s.user_id = $2`,
    [sensorId, userId]
  );
};

exports.getSensorHistory = (sensorId, days = 28) => {
  return pool.query(
    `SELECT * FROM moisture_level_history 
     WHERE sensor_id = $1 AND time_stamp >= NOW() - INTERVAL '${days} days'
     ORDER BY time_stamp ASC`,
    [sensorId]
  );
};

exports.insertSensor = (user_id, name, moisture) => {
  return pool.query(
    "INSERT INTO moisture_sensor (user_id, name, current_moisture_level, date_added) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *",
    [user_id, name, moisture]
  );
};

exports.updateSensor = (id, name, moisture) => {
  return pool.query(
    "UPDATE moisture_sensor SET name = $1, current_moisture_level = $2 WHERE id = $3 RETURNING *",
    [name, moisture, id]
  );
};

exports.detachSensorFromPlant = (sensorId) => {
  return pool.query(
    "UPDATE user_plant SET moisture_sensor_id = NULL WHERE moisture_sensor_id = $1",
    [sensorId]
  );
};

exports.deleteSensorHistory = (sensorId) => {
  return pool.query(
    "DELETE FROM moisture_level_history WHERE sensor_id = $1",
    [sensorId]
  );
};

exports.deleteSensor = (id) => {
  return pool.query("DELETE FROM moisture_sensor WHERE id = $1 RETURNING *", [id]);
};

exports.insertSensorData = (moisture, id) => {
  return pool.query(
    "UPDATE moisture_sensor SET current_moisture_level = $1 WHERE id = $2 RETURNING *",
    [moisture, id]
  );
};

exports.insertSensorHistory = (sensorId, moistureLevel) => {
  return pool.query(
    "INSERT INTO moisture_level_history (sensor_id, moisture_level, time_stamp) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *",
    [sensorId, moistureLevel]
  );
};

exports.attachSensorToPlant = (plantId, sensorId) => {
  return pool.query(
    "UPDATE user_plant SET moisture_sensor_id = $1 WHERE id = $2",
    [sensorId, plantId]
  );
};
