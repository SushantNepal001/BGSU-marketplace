const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title must not exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must not exceed 1000 characters"],
    },
    price: {
      type: Number,
      default: null,
      min: [0, "Price must be positive"],
      max: [999999, "Price is too high"],
      validate: {
        validator: function(value) {
          // Price is required only for 'sell' type
          if (this.type === 'sell') return value != null && value > 0;
          return true; // For 'free' and 'trade' types, price is optional
        },
        message: "Price is required for sell listings",
      },
    },
    category: {
      type: String,
      enum: ["Books", "Furniture", "Electronics", "Housing", "Misc"],
      required: [true, "Category is required"],
    },
    type: {
      type: String,
      enum: ["sell", "free", "trade"],
      default: "sell",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length <= 5,
        message: "A maximum of 5 image URLs is allowed",
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    userEmail: {
      type: String,
      required: [true, "User email is required"],
      lowercase: true,
      trim: true,
      match: [/.+@bgsu\.edu$/, "Email must be a valid BGSU email (@bgsu.edu)"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
listingSchema.index({ owner: 1 });
listingSchema.index({ userEmail: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Listing", listingSchema);
