import { useState } from 'react'
import ListingCard from '../components/ListingCard'
import styles from './Home.module.css'

// Temporary fake data until the backend is ready
const MOCK_LISTINGS = [
  { _id: '1', title: 'MacBook Air M1 — great condition', price: 280, type: 'sell', category: 'Electronics', images: [], createdAt: new Date(Date.now() - 7200000) },
  { _id: '2', title: 'Organic Chemistry textbook 5th Ed — trade for Calc book', price: 0, type: 'trade', category: 'Books', images: [], createdAt: new Date(Date.now() - 18000000) },
  { _id: '3', title: 'IKEA desk chair — moving out, must go', price: 0, type: 'free', category: 'Furniture', images: [], createdAt: new Date(Date.now() - 86400000) },
  { _id: '4', title: 'PS5 controller — used twice', price: 45, type: 'sell', category: 'Electronics', images: [], createdAt: new Date(Date.now() - 10800000) },
  { _id: '5', title: 'BGSU hoodie size M — worn once', price: 15, type: 'sell', category: 'Clothing', images: [], createdAt: new Date(Date.now() - 21600000) },
  { _id: '6', title: '24" monitor — HDMI + DisplayPort, perfect for dorm', price: 120, type: 'sell', category: 'Electronics', images: [], createdAt: new Date(Date.now() - 172800000) },
]

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Other']

function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery]       = useState('')

  const filtered = MOCK_LISTINGS.filter((l) => {
    const matchesCategory = activeCategory === 'All' || l.category === activeCategory
    const matchesSearch   = l.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className={styles.page}>

      {/* Category filter chips */}
      <div className={styles.filters}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.chip} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className={styles.count}>{filtered.length} listings</p>

      {/* Masonry grid */}
      {filtered.length > 0 ? (
        <div className={styles.masonry}>
          {filtered.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>No listings found 😕</p>
          <p>Try a different category or search term</p>
        </div>
      )}

    </div>
  )
}

export default Home