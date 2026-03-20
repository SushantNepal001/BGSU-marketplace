const express = require("express");
const protect = require("../middleware/auth");
const Listing = require("../models/Listing");
const User = require("../models/User");

const router = express.Router();

/**
 * GET /api/users
 * Get all users (public)
 */
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/with-listings
 * Get all users with their listings (public)
 */
router.get("/with-listings", async (req, res, next) => {
  try {
    const [users, listings] = await Promise.all([
      User.find().select("-password").lean(),
      Listing.find().populate("owner", "name email").lean(),
    ]);

    const listingsByOwnerId = listings.reduce((acc, listing) => {
      const ownerId =
        listing.owner?._id?.toString() || listing.owner?.toString();
      if (!ownerId) return acc;
      if (!acc[ownerId]) acc[ownerId] = [];
      acc[ownerId].push(listing);
      return acc;
    }, {});

    // Backward-compatibility for older listings that only have userEmail.
    const listingsByEmail = listings.reduce((acc, listing) => {
      if (listing.owner || !listing.userEmail) return acc;
      if (!acc[listing.userEmail]) acc[listing.userEmail] = [];
      acc[listing.userEmail].push(listing);
      return acc;
    }, {});

    const usersWithListings = users.map((user) => ({
      ...user,
      listings:
        listingsByOwnerId[user._id.toString()] ||
        listingsByEmail[user.email] ||
        [],
    }));

    res.status(200).json({
      success: true,
      count: usersWithListings.length,
      data: usersWithListings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/me
 * Get current logged-in user (protected)
 */
router.get("/me", protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
