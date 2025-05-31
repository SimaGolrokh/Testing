const express = require("express");
const router = express.Router();
const sensor = require("../controllers/sensor");
const verifySensorToken = require("../middleware/sensor");
const authenticateJWT = require("../middleware/auth");


// Sensor routes
router.post("/pair", sensor.pairSensor);
router.get("/sensor", authenticateJWT, sensor.getAllSensors);
router.get("/sensor/:id", authenticateJWT, sensor.getSensorById);
router.post("/sensor", sensor.createSensor);
router.put("/sensor/:id", authenticateJWT, sensor.updateSensor);
router.delete("/sensor/:id", authenticateJWT, sensor.deleteSensor);
router.post("/data", verifySensorToken, sensor.submitSensorData);
router.post("/sensor/refresh-token", authenticateJWT, sensor.refreshSensorToken);
router.get("/sensor/:id/details", authenticateJWT, sensor.getSensorWithHistory);

router.post("/sensor/refresh-token", sensor.refreshSensorToken);

module.exports = router;
