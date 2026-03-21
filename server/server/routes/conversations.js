const express = require("express");
const mongoose = require("mongoose");
const protect = require("../middleware/auth");
const Conversation = require("../models/Conversation");

const router = express.Router();

/**
 * POST /api/conversations
 * Create or get a conversation between two users for a listing.
 */
router.post("/", protect, async (req, res, next) => {
  try {
    const { senderId, receiverId, listingId } = req.body;

    if (!senderId || !receiverId || !listingId) {
      return res.status(400).json({
        success: false,
        message: "senderId, receiverId and listingId are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(listingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid senderId, receiverId, or listingId",
      });
    }

    if (senderId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: senderId must match authenticated user",
      });
    }

    let conversation = await Conversation.findOne({
      listingId,
      members: { $all: [senderId, receiverId], $size: 2 },
    })
      .populate("members", "name email")
      .populate("listingId", "title owner");

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
        listingId,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("members", "name email")
        .populate("listingId", "title owner");
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/conversations/:userId
 * Get all conversations where the user is a member.
 */
router.get("/:userId", protect, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only view your own conversations",
      });
    }

    const conversations = await Conversation.find({ members: userId })
      .populate("members", "name email")
      .populate("listingId", "title owner")
      .sort({ updatedAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
