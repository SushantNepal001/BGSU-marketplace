import { useState } from 'react'
import ListingCard from '../components/ListingCard'
import useListings from '../hooks/useListings'
import styles from './Home.module.css'

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Other']

function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch listings from backend API
  const filters = activeCategory !== 'All' ? { category: activeCategory } : {}
  const { listings, loading, error } = useListings(filters)

  // Filter by search query
  const filtered = listings.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      {loading && <p className={styles.count}>Loading listings...</p>}
      {error && <p className={styles.count} style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && <p className={styles.count}>{filtered.length} listings</p>}

      {/* Masonry grid */}
      {!loading && filtered.length > 0 ? (
        <div className={styles.masonry}>
          {filtered.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      ) : !loading ? (
        <div className={styles.empty}>
          <p>No listings found 😕</p>
          <p>Try a different category or search term</p>
        </div>
      ) : null}

    </div>
  )
}

export default Home