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

const parsePositiveInteger = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const CATEGORIES = ["Books", "Furniture", "Electronics", "Housing", "Misc"];

const singularize = (word) => {
  if (word.endsWith("ies") && word.length > 3) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith("s") && word.length > 3) {
    return word.slice(0, -1);
  }

  return word;
};

const pluralize = (word) => {
  if (word.endsWith("y") && word.length > 1) {
    return `${word.slice(0, -1)}ies`;
  }

  if (word.endsWith("s")) {
    return word;
  }

  return `${word}s`;
};

const normalizeCategory = (value) => {
  if (!value) return null;

  const input = value.toString().trim().toLowerCase();
  if (!input) return null;

  const inputSingular = singularize(input);

  return (
    CATEGORIES.find((categoryValue) => {
      const normalized = categoryValue.toLowerCase();
      return normalized === input || singularize(normalized) === inputSingular;
    }) || null
  );
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCategoryMatchFilter = (value) => {
  const normalized = normalizeCategory(value);
  if (!normalized) return null;

  const singular = singularize(normalized.toLowerCase());
  const plural = pluralize(singular);

  return {
    $regex: `^(${escapeRegExp(singular)}|${escapeRegExp(plural)})$`,
    $options: "i",
  };
};

const buildNormalizedTextQuery = (query) => {
  if (!query) return "";

  const terms = query
    .toString()
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    .filter(Boolean);

  if (terms.length === 0) return "";

  const expandedTerms = new Set();

  for (const term of terms) {
    expandedTerms.add(term);

    const singular = singularize(term);
    const plural = pluralize(term);

    expandedTerms.add(singular);
    expandedTerms.add(plural);
  }

  return Array.from(expandedTerms).join(" ");
};

const hasTooManyImages = (images) => images.length > 5;

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
 * GET /api/listings/search
 * Advanced listing search with text query, filters, pagination, and sorting
 */
router.get("/search", async (req, res, next) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      page = "1",
      limit = "10",
    } = req.query;

    const currentPage = parsePositiveInteger(page, 1);
    const perPage = parsePositiveInteger(limit, 10);
    const min = parseNumber(minPrice);
    const max = parseNumber(maxPrice);
    const normalizedSearchQuery = buildNormalizedTextQuery(q);
    const categoryFilter = getCategoryMatchFilter(category);
    const queryCategoryFilter = getCategoryMatchFilter(q);

    if (min !== null && min < 0) {
      return res.status(400).json({
        success: false,
        message: "minPrice must be greater than or equal to 0",
      });
    }

    if (max !== null && max < 0) {
      return res.status(400).json({
        success: false,
        message: "maxPrice must be greater than or equal to 0",
      });
    }

    if (min !== null && max !== null && min > max) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice",
      });
    }

    const baseFilter = {};

    if (categoryFilter) {
      baseFilter.category = categoryFilter;
    } else if (category) {
      // Keep fallback behavior for unknown category values provided by clients.
      baseFilter.category = category;
    }

    if (min !== null || max !== null) {
      baseFilter.price = {};
      if (min !== null) baseFilter.price.$gte = min;
      if (max !== null) baseFilter.price.$lte = max;
    }

    const filter = { ...baseFilter };

    if (normalizedSearchQuery) {
      filter.$text = { $search: normalizedSearchQuery };
    }

    const skip = (currentPage - 1) * perPage;

    const query = Listing.find(filter).populate("owner", "name email");

    if (normalizedSearchQuery) {
      query
        .select({ score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, createdAt: -1 });
    } else {
      query.sort({ createdAt: -1 });
    }

    query.skip(skip).limit(perPage);

    let [listings, totalResults] = await Promise.all([
      query.exec(),
      Listing.countDocuments(filter),
    ]);

    // Fallback for category-like q values when text index does not surface category matches.
    if (
      normalizedSearchQuery &&
      !category &&
      queryCategoryFilter &&
      totalResults === 0
    ) {
      const fallbackFilter = {
        ...baseFilter,
        category: queryCategoryFilter,
      };

      [listings, totalResults] = await Promise.all([
        Listing.find(fallbackFilter)
          .populate("owner", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(perPage)
          .exec(),
        Listing.countDocuments(fallbackFilter),
      ]);
    }

    const totalPages =
      totalResults === 0 ? 0 : Math.ceil(totalResults / perPage);

    return res.status(200).json({
      totalResults,
      currentPage,
      totalPages,
      listings,
    });
  } catch (error) {
    return next(error);
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
 * imageUrl is optional and comes from Cloudinary
 */
router.post("/", protect, async (req, res, next) => {
  try {
    const { title, category, type, images } = req.body;
    const imageList = Array.isArray(images) ? images : [];

    // Validate required fields
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, category",
      });
    }

    // Price is only required for 'sell' type
    if (type === 'sell' && (!req.body.price || req.body.price <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Price is required and must be greater than 0 for sell listings",
      });
    }

    if (hasTooManyImages(imageList)) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 5 image URLs is allowed",
      });
    }

    // Create new listing
    const newListing = new Listing({
      ...req.body,
      images: imageList,
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
    const { title, description, price, category, images } = req.body;

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
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          message: "images must be an array of URLs",
        });
      }

      if (hasTooManyImages(images)) {
        return res.status(400).json({
          success: false,
          message: "A maximum of 5 image URLs is allowed",
        });
      }

      listing.images = images;
    }

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
