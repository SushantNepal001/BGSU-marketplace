const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2,
        message: "Conversation must include exactly two members",
      },
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
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

conversationSchema.index({ listingId: 1, members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
