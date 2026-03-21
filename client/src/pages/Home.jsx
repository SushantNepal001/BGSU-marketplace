import { useState } from 'react'
import ListingCard from '../components/ListingCard'
import SearchBar from '../components/SearchBar'
import useListings from '../hooks/useListings'
import { useSearch } from '../hooks/useSearch'
import styles from './Home.module.css'

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Housing', 'Misc']

function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Search results from backend
  const { results: searchResults, loading: searchLoading, error: searchError } = useSearch(searchQuery)

  // Browse listings with category filter
  const filters = activeCategory !== 'All' ? { category: activeCategory } : {}
  const { listings, loading: browseLoading, error: browseError } = useListings(filters)

  // Show search results if searching, otherwise show category browse
  const isSearching = searchQuery.trim().length > 0
  const displayListings = isSearching ? searchResults : listings
  const loading = isSearching ? searchLoading : browseLoading
  const error = isSearching ? searchError : browseError

  return (
    <div className={styles.page}>
      {/* Search bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} loading={searchLoading} />

      {/* Category filter chips - only show when not searching */}
      {!isSearching && (
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
      )}

      {/* Results count */}
      {loading && <p className={styles.count}>Loading listings...</p>}
      {error && <p className={styles.count} style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <p className={styles.count}>
          {isSearching ? `Found ${displayListings.length} result(s)` : `${displayListings.length} listings`}
        </p>
      )}

      {/* Masonry grid */}
      {!loading && displayListings.length > 0 ? (
        <div className={styles.masonry}>
          {displayListings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      ) : !loading ? (
        <div className={styles.empty}>
          <p>No listings found 😕</p>
          <p>Try a different {isSearching ? 'search term' : 'category'}</p>
        </div>
      ) : null}
    </div>
  )
}

export default Home