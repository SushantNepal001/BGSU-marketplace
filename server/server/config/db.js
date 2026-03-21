const mongoose = require("mongoose");

// Fail queries fast when there is no DB connection instead of buffering indefinitely.
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/falcon-marketplace";

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  console.log("✓ MongoDB Connected Successfully");
  return mongoose.connection;
};

module.exports = connectDB;
