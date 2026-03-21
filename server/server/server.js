const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
require("dotenv").config();

// Import configuration and middleware
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const listingsRouter = require("./routes/listings");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const remixRouter = require("./routes/remix");

// Initialize Express app
const app = express();

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const envAllowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

// ============ MIDDLEWARE ============
// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header) and trusted local/browser origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ API ROUTES ============
// Health check endpoint
app.get("/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    success: true,
    message: dbConnected ? "Server is running" : "Server is running, database disconnected",
    dbConnected,
    timestamp: new Date().toISOString(),
  });
});

// Listings API routes
app.use("/api/listings", listingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/remix", remixRouter);

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ============ ERROR HANDLING MIDDLEWARE ============
// This should be the last middleware
app.use(errorHandler);

// ============ SERVER STARTUP ============
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`

║   FALCON MARKETPLACE API Server Running   ║
Server: http://localhost:${PORT}
Health Check: http://localhost:${PORT}/health
  `);
    });
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

startServer();

// ============ GRACEFUL SHUTDOWN ============
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
