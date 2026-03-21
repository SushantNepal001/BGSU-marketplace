import { useState, useEffect } from 'react'
import { reviews as reviewsAPI } from '../api'
import RatingStars from './RatingStars'
import styles from './ReviewList.module.css'

function ReviewList({ listingId, refreshTrigger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await reviewsAPI.getListingReviews(listingId)
        setData(response.data.data)
      } catch (err) {
        console.error('Error fetching reviews:', err)
        setError(err.response?.data?.message || 'Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [listingId, refreshTrigger])

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading reviews...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    )
  }

  const { reviews = [], stats } = data || {}

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Customer Reviews</h2>

      {!stats || stats.totalReviews === 0 ? (
        <div className={styles.noReviews}>
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <div className={styles.statsSection}>
            <div className={styles.ratingBox}>
              <div className={styles.averageRating}>
                {stats.averageRating.toFixed(1)}
              </div>
              <RatingStars
                rating={stats.averageRating}
                count={stats.totalReviews}
                size="large"
              />
            </div>

            {/* Star Distribution */}
            <div className={styles.distribution}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats[`${star}StarCount`] || 0
                const percentage =
                  stats.totalReviews > 0
                    ? Math.round((count / stats.totalReviews) * 100)
                    : 0

                return (
                  <div key={star} className={styles.distributionRow}>
                    <span className={styles.starLabel}>{star}★</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={styles.count}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className={styles.reviewsList}>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.avatar}>
                        {review.reviewer.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className={styles.reviewerName}>
                          {review.reviewer.name}
                        </p>
                        <p className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} size="small" />
                  </div>

                  <p className={styles.reviewComment}>{review.comment}</p>
                </div>
              ))
            ) : (
              <p className={styles.noComments}>
                No detailed reviews to display
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ReviewList
