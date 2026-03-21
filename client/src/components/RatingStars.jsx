import styles from './RatingStars.module.css'

function RatingStars({ rating, count, interactive, onRate, size = 'medium' }) {
  const stars = [1, 2, 3, 4, 5]

  const handleStarClick = (starValue) => {
    if (interactive && onRate) {
      onRate(starValue)
    }
  }

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.stars}>
        {stars.map((star) => (
          <span
            key={star}
            className={`${styles.star} ${
              star <= Math.round(rating)
                ? styles.filled
                : star - 0.5 <= rating
                ? styles.half
                : ''
            } ${interactive ? styles.interactive : ''}`}
            onClick={() => handleStarClick(star)}
          >
            ★
          </span>
        ))}
      </div>
      {count !== undefined && (
        <span className={styles.count}>({count} reviews)</span>
      )}
    </div>
  )
}

export default RatingStars
