const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

// Import configuration and middleware
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const listingsRouter = require("./routes/listings");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");

// Initialize Express app
const app = express();

// ============ MIDDLEWARE ============
// Security middleware
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ DATABASE CONNECTION ============
connectDB();

// ============ API ROUTES ============
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Listings API routes
app.use("/api/listings", listingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

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
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🦅 FALCON MARKETPLACE API Server Running   ║
╚═══════════════════════════════════════════════╝
📍 Server: http://localhost:${PORT}
📝 Health Check: http://localhost:${PORT}/health
🔗 Listings API: http://localhost:${PORT}/api/listings
🔐 Auth API: http://localhost:${PORT}/api/auth
  `);
});

// ============ GRACEFUL SHUTDOWN ============
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
