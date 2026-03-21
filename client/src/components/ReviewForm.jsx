import { useState } from 'react'
import { reviews as reviewsAPI } from '../api'
import RatingStars from './RatingStars'
import styles from './ReviewForm.module.css'

function ReviewForm({ listingId, sellerId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const maxCommentLength = 500

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!comment.trim()) {
      setError('Comment is required')
      return
    }

    if (comment.length > maxCommentLength) {
      setError(`Comment must be ${maxCommentLength} characters or less`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await reviewsAPI.create({
        listingId,
        sellerId,
        rating,
        comment: comment.trim(),
      })

      setSuccess(true)
      setRating(5)
      setComment('')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)

      // Trigger parent to refresh reviews
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Leave a Review</h3>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>Review submitted successfully!</div>}

      <div className={styles.formGroup}>
        <label className={styles.label}>Rating</label>
        <RatingStars
          rating={rating}
          interactive
          onRate={setRating}
          size="large"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="comment" className={styles.label}>
          Comment
        </label>
        <textarea
          id="comment"
          className={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this listing..."
          rows="4"
          maxLength={maxCommentLength}
        />
        <div className={styles.charCount}>
          {comment.length} / {maxCommentLength}
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

export default ReviewForm
