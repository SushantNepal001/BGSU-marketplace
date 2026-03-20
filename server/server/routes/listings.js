const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const Listing = require("../models/Listing");

const getOwnerIdString = (owner) => {
  if (!owner) return null;
  if (owner._id) return owner._id.toString();
  return owner.toString();
};

/**
 * GET /api/listings
 * Get all listings sorted by newest first
 */
router.get("/", async (req, res, next) => {
  try {
    const { category, userEmail, userId, sort = "-createdAt" } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (userEmail) filter.userEmail = userEmail.toLowerCase();
    if (userId) filter.owner = userId;

    const listings = await Listing.find(filter)
      .populate("owner", "name email")
      .sort(sort)
      .exec();

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("owner", "name email");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/listings
 * Create a new listing
 * Requires auth + title, price, category
 */
router.post("/", protect, async (req, res, next) => {
  try {
    const { title, description, price, category, imageUrl } = req.body;

    // Validate required fields
    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, price, category",
      });
    }

    // Create new listing
    const newListing = new Listing({
      title,
      description,
      price,
      category,
      imageUrl,
      owner: req.user._id,
      userEmail: req.user.email,
    });

    // Save to database
    const savedListing = await newListing.save();
    await savedListing.populate("owner", "name email");

    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: savedListing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/listings/:id
 * Update a listing
 */
router.put("/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, imageUrl } = req.body;

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const ownerId = getOwnerIdString(listing.owner);
    const isOwnerById = ownerId && ownerId === req.user._id.toString();
    const isOwnerByEmail = !ownerId && listing.userEmail === req.user.email;

    if (!isOwnerById && !isOwnerByEmail) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only update your own listings",
      });
    }

    // Backfill owner on legacy records that predate owner ObjectId support.
    if (!ownerId && isOwnerByEmail) {
      listing.owner = req.user._id;
    }

    // Build update object (only include provided fields)
    if (title !== undefined) listing.title = title;
    if (description !== undefined) listing.description = description;
    if (price !== undefined) listing.price = price;
    if (category !== undefined) listing.category = category;
    if (imageUrl !== undefined) listing.imageUrl = imageUrl;

    const updatedListing = await listing.save();
    await updatedListing.populate("owner", "name email");

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: updatedListing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/listings/admin/all
 * Delete all listings (admin only)
 */
router.delete("/admin/all", protect, requireAdmin, async (req, res, next) => {
  try {
    const result = await Listing.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "All listings deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing
 */
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("owner", "name email");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const ownerId = getOwnerIdString(listing.owner);
    const isOwnerById = ownerId && ownerId === req.user._id.toString();
    const isOwnerByEmail = !ownerId && listing.userEmail === req.user.email;

    if (!isOwnerById && !isOwnerByEmail) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only delete your own listings",
      });
    }

    await listing.deleteOne();

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      data: listing,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
