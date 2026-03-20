const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/falcon-marketplace";

    await mongoose.connect(mongoUri);

    console.log("✓ MongoDB Connected Successfully");
    return mongoose.connection;
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
