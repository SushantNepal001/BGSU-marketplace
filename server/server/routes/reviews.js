const express = require('express')
const Review = require('../models/Review')
const protect = require('../middleware/auth')
const mongoose = require('mongoose')

const router = express.Router()

// Create a review
router.post('/', protect, async (req, res) => {
  try {
    const { listingId, sellerId, rating, comment } = req.body
    const reviewerId = req.user.id

    // Check if user already reviewed this listing
    const existingReview = await Review.findOne({
      listing: listingId,
      reviewer: reviewerId,
    })

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this listing',
      })
    }

    const review = new Review({
      listing: listingId,
      reviewer: reviewerId,
      seller: sellerId,
      rating,
      comment,
    })

    await review.save()
    await review.populate('reviewer', 'name email')

    res.status(201).json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Error creating review:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Get reviews for a listing with aggregated stats
router.get('/listing/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID',
      })
    }

    // Get stats using aggregation pipeline
    const stats = await Review.aggregate([
      {
        $match: {
          listing: new mongoose.Types.ObjectId(listingId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
          },
          threeStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
          },
          twoStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
          },
          oneStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
          },
        },
      },
    ])

    // Get individual reviews
    const reviews = await Review.find({ listing: listingId })
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 })

    const aggregatedStats = stats.length > 0 ? stats[0] : null

    res.json({
      success: true,
      data: {
        reviews,
        stats: aggregatedStats,
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Get single review
router.get('/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId).populate(
      'reviewer',
      'name email'
    )

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      })
    }

    res.json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Update review
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      })
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      })
    }

    review.rating = req.body.rating || review.rating
    review.comment = req.body.comment || review.comment

    await review.save()
    await review.populate('reviewer', 'name email')

    res.json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error('Error updating review:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Delete review
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      })
    }

    // Check if user owns the review
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      })
    }

    await Review.findByIdAndDelete(req.params.reviewId)

    res.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// Get seller's rating stats
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID',
      })
    }

    const stats = await Review.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
          },
          threeStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
          },
          twoStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
          },
          oneStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
          },
        },
      },
    ])

    const sellerStats = stats.length > 0 ? stats[0] : null

    res.json({
      success: true,
      data: sellerStats,
    })
  } catch (error) {
    console.error('Error fetching seller stats:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
