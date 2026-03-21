import { Link } from 'react-router-dom'
import styles from './ListingCard.module.css'

const BADGE_COLORS = {
  sell:  styles.badgeSell,
  trade: styles.badgeTrade,
  free:  styles.badgeFree,
}

function ListingCard({ listing }) {
  const { _id, title, price, type, category, images, createdAt } = listing

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const displayPrice = () => {
    if (type === 'free')  return { label: 'Free',  className: styles.priceFree }
    if (type === 'trade') return { label: 'Trade', className: styles.priceDefault }
    return { label: `$${price}`, className: styles.priceDefault }
  }

  const { label, className } = displayPrice()

  return (
    <Link to={`/listings/${_id}`} className={styles.card}>

      {/* Image */}
      <div className={styles.imgWrap}>
        {images && images.length > 0 ? (
          <img src={images[0]} alt={title} className={styles.img} />
        ) : (
          <div className={styles.imgPlaceholder}>📦</div>
        )}
        <span className={`${styles.badge} ${BADGE_COLORS[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </div>

      {/* Info */}
      <div className={styles.body}>
        <div className={className}>{label}</div>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>
          <span className={styles.category}>{category}</span>
          <span className={styles.time}>{timeAgo(createdAt)}</span>
        </div>
      </div>

    </Link>
  )
}

export default ListingCard