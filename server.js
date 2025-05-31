require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const pool = require("./config/db");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 3000;

const http = require("http");
const server = http.createServer(app);

// routes
const authRoutes = require("./routes/auth");
const errorHandler = require("./middleware/errorHandler");
const authenticateJWT = require("./middleware/auth");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
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
