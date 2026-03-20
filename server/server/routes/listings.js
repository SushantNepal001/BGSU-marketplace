const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const validateBGSUEmail = require("../middleware/validateEmail");

/**
 * GET /api/listings
 * Get all listings sorted by newest first
 */
router.get("/", async (req, res, next) => {
  try {
    const { category, userEmail, sort = "-createdAt" } = req.query;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (userEmail) filter.userEmail = userEmail.toLowerCase();

    const listings = await Listing.find(filter).sort(sort).exec();

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

    const listing = await Listing.findById(id);

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
 * Requires: title, price, category, userEmail
 */
router.post("/", validateBGSUEmail, async (req, res, next) => {
  try {
    const { title, description, price, category, imageUrl, userEmail } =
      req.body;

    // Validate required fields
    if (!title || !price || !category || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, price, category, userEmail",
      });
    }

    // Create new listing
    const newListing = new Listing({
      title,
      description,
      price,
      category,
      imageUrl,
      userEmail: userEmail.toLowerCase(),
    });

    // Save to database
    const savedListing = await newListing.save();

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
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, imageUrl } = req.body;

    // Build update object (only include provided fields)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updatedListing = await Listing.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

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
 * DELETE /api/listings/:id
 * Delete a listing
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      data: deletedListing,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
