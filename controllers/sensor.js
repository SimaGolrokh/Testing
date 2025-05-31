const asyncHandler = require("express-async-handler");
const sensorModel = require("../models/sensor");
const jwt = require("jsonwebtoken");

function interpretSoilMoisture(rawValue) {
  if (rawValue > 800) return "Very Dry";
  else if (rawValue > 600) return "Dry";
  else if (rawValue > 400) return "Moist";
  else if (rawValue > 200) return "Wet";
  else return "Very Wet";
}

function getMoisturePercentage(rawValue) {
  const percentage = Math.max(0, Math.min(100, Math.round(((1023 - rawValue) / 1023) * 100)));
  return percentage;
}

exports.pairSensor = asyncHandler(async (req, res) => {
  const { name, plant_id, user_id, current_moisture_level } = req.body;


  //  Create sensor
  const result = await sensorModel.insertSensor(user_id, name, current_moisture_level);
  const sensor = result.rows[0];

  //  Link sensor to plant
  await sensorModel.attachSensorToPlant(plant_id, sensor.id);

  // Generate JWT
  const accessToken = jwt.sign({ sensorId: sensor.id, user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const refreshToken = jwt.sign({ sensorId: sensor.id, user_id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "14d" });

  // send both to sensor
  res.status(201).json({
    message: "Sensor paired successfully",
    accessToken,
    refreshToken,
    sensor,

  });
});


exports.submitSensorData = asyncHandler(async (req, res) => {
  const { moisture } = req.body;
  const { sensorId } = req.sensor;

  // Try to convert to number
  const parsedMoisture = Number(moisture);

  // Validate


  // Update current level
  const updateResult = await sensorModel.insertSensorData(parsedMoisture, sensorId);

  // Store in history
  const historyResult = await sensorModel.insertSensorHistory(sensorId, parsedMoisture);

  // Interpret value
  const label = interpretSoilMoisture(parsedMoisture);
  const percentage = getMoisturePercentage(parsedMoisture);

  res.status(201).json({
    success: true,
    current: {
      ...updateResult.rows[0],
      interpretation: label,
      percentage: percentage + "%",
    },
    history: historyResult.rows[0],
  });
});


exports.getAllSensors = asyncHandler(async (req, res) => {
  const userId = req.user.id; // from JWT
  const result = await sensorModel.findAllSensors(userId);

  const sensors = result.rows.map(sensor => {
    const interpretedMoisture = interpretSoilMoisture(sensor.current_moisture_level);
    const percentage = getMoisturePercentage(sensor.current_moisture_level);

    return {
      ...sensor,
      interpretedMoisture,
      percentage: percentage + "%"
    };
  });

  res.json(sensors);
});

exports.getSensorById = asyncHandler(async (req, res) => {
  const sensorId = req.params.id;
  const userId = req.user.id;
  const result = await sensorModel.findSensorByIdWithPlant(sensorId, userId);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Sensor not found or not authorized" });
  }
  const sensor = result.rows[0];
  const interpretedMoisture = interpretSoilMoisture(sensor.current_moisture_level);
  const percentage = getMoisturePercentage(sensor.current_moisture_level);

  res.json({
    ...sensor,
    interpretedMoisture,
    percentage: percentage + "%"
  });
});

exports.getSensorWithHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const sensorResult = await sensorModel.findSensorByIdWithPlant(id, userId);
  if (sensorResult.rows.length === 0) return res.status(404).json({ error: "Sensor not found" });
  const historyResult = await sensorModel.getSensorHistory(id, 28); // last 4 weeks
  res.json({
    sensor: sensorResult.rows[0],
    history: historyResult.rows.map(entry => ({
      ...entry,
      interpreted: interpretSoilMoisture(entry.moisture_level)
    }))
  });
});

exports.createSensor = asyncHandler(async (req, res) => {
  const { user_id, name, current_moisture_level } = req.body;
  const result = await sensorModel.insertSensor(user_id, name, current_moisture_level);
  res.status(201).json(result.rows[0]);
});

exports.updateSensor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, current_moisture_level, plant_id } = req.body;

  const result = await sensorModel.updateSensor(id, name, current_moisture_level);

  if (plant_id) {
    await sensorModel.attachSensorToPlant(plant_id, id);
  }

  if (result.rows.length === 0) return res.status(404).json({ error: "Sensor not found" });

  res.json(result.rows[0]);
});

exports.deleteSensor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await sensorModel.detachSensorFromPlant(id);
  await sensorModel.deleteSensorHistory(id);
  const result = await sensorModel.deleteSensor(id);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Sensor not found" });
  }

  res.json({ message: "Sensor deleted successfully" });
});

exports.refreshSensorToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { sensorId: payload.sensorId, user_id: payload.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

exports.interpretSoilMoisture = interpretSoilMoisture;
exports.getMoisturePercentage = getMoisturePercentage;
