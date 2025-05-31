const { Client } = require("pg");
const { notifyClients, setPendingSensor } = require("../sockets/socketHandler");
const { interpretSoilMoisture, getMoisturePercentage } = require("../controllers/sensor");
require("dotenv").config();

const pgClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pgClient.connect()
    .then(() => {
        console.log("Connected to PostgreSQL LISTEN client.");
        pgClient.query("LISTEN moisture_channel");
        pgClient.query("LISTEN new_sensor_channel");
    })
    .catch(err => console.error("Error connecting to PostgreSQL:", err.message));

pgClient.on("notification", (msg) => {
    const payload = JSON.parse(msg.payload || "{}");

    if (msg.channel === "moisture_channel") {
        const interpretedLevel = interpretSoilMoisture(payload.moisture_level);
        const percentage = getMoisturePercentage(payload.moisture_level);
        notifyClients(payload.user_id, {
            type: "MOISTURE_UPDATE",
            sensorId: payload.sensorId,
            moisture_level: payload.moisture_level,
            interpreted_level: interpretedLevel,
            percentage: `${percentage} %`,
        });
    }

    if (msg.channel === "new_sensor_channel") {
        const interpretedLevel = interpretSoilMoisture(payload.moisture_level);
        const percentage = getMoisturePercentage(payload.moisture_level);

        console.log("[PG Notify] NEW_SENSOR Payload:", payload);

        setPendingSensor(payload.user_id, {
            type: "NEW_SENSOR",
            sensorId: payload.sensorId,
            moisture_level: payload.moisture_level,
            interpreted_level: interpretedLevel,
            percentage: `${percentage} %`,
            user_plant_id: payload.user_plant_id,
            plant_nickname: payload.plant_nickname,
            sensorName: payload.sensor_name,
        });
    }
});
