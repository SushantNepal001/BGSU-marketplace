const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing is required for a review'],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate reviews on same listing by same reviewer
reviewSchema.index({ listing: 1, reviewer: 1 }, { unique: true });

// Additional indexes for common queries
reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ listing: 1, createdAt: -1 });

// Prevent duplicate reviews
reviewSchema.pre('save', async function () {
  if (this.isNew) {
    const existingReview = await mongoose.model('Review').findOne({
      listing: this.listing,
      reviewer: this.reviewer,
    });

    if (existingReview) {
      throw new Error('You have already reviewed this listing');
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
