require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const pool = require("./config/db");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


const { initSocketIO } = require("./sockets/socketHandler");
initSocketIO(io);
require("./listeners/moistureListener");

// routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const plantRoutes = require("./routes/plant");
const gardenRoutes = require("./routes/garden");
const errorHandler = require("./middleware/errorHandler");
const authenticateIP = require("./middleware/ip");
const authenticateJWT = require("./middleware/auth");
const jsonrefresh = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("combined")); // Allows JSON requests
app.use(authenticateIP);
app.use(cookieParser());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateJWT, userRoutes);
app.use("/api/plants", authenticateJWT, plantRoutes);
app.use("/api/gardens", authenticateJWT, gardenRoutes);
app.use("/api/auth", jsonrefresh);
app.use("/api/sensor", sensorRoutes);
app.use(errorHandler);


// Start server
server.listen(port, "0.0.0.0", async () => {
  console.log(`Server running on port ${port}`);

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Connected to the database. Server time:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
  }

});
