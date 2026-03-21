import { useState } from 'react'
import ListingCard from '../components/ListingCard'
import SearchBar from '../components/SearchBar'
import useListings from '../hooks/useListings'
import { useSearch } from '../hooks/useSearch'
import { remix } from '../api'
import styles from './Home.module.css'

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Housing', 'Misc']

function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewLoadingId, setPreviewLoadingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalListingTitle, setModalListingTitle] = useState('')
  const [modalStatus, setModalStatus] = useState('idle')
  const [modalError, setModalError] = useState('')
  const [modalVideoUrl, setModalVideoUrl] = useState('')

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

  const closeModal = () => {
    setModalOpen(false)
    setModalStatus('idle')
    setModalError('')
    setModalVideoUrl('')
  }

  const handlePreviewTrailer = async (listing) => {
    setPreviewLoadingId(listing._id)
    setModalOpen(true)
    setModalListingTitle(listing.title)
    setModalStatus('creating')
    setModalError('')
    setModalVideoUrl('')

    try {
      const createRes = await remix.create({
        style: 'fake-product-trailer',
        sourcePlatform: 'listing',
        sourceHandle: '',
        listingSnapshot: {
          listingId: listing._id,
          title: listing.title,
          description: listing.description || listing.title,
          price: listing.price,
          imageUrl: listing.images?.[0] || '',
          listingUrl: `${window.location.origin}/listings/${listing._id}`,
        },
      })

      const jobId = createRes.data?.data?.id
      if (!jobId) {
        throw new Error('Could not start trailer generation')
      }

      setModalStatus('processing')

      for (let i = 0; i < 20; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const refreshRes = await remix.refresh(jobId)
        const job = refreshRes.data?.data

        if (job?.status === 'done' && job?.resultUrl) {
          setModalVideoUrl(job.resultUrl)
          setModalStatus('done')
          setPreviewLoadingId(null)
          return
        }

        if (job?.status === 'failed') {
          throw new Error(job.errorMessage || 'Trailer generation failed')
        }
      }

      throw new Error('Generation timed out. Please try again.')
    } catch (err) {
      setModalStatus('error')
      setModalError(err.response?.data?.message || err.message || 'Unable to generate trailer')
    } finally {
      setPreviewLoadingId(null)
    }
  }

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
            <ListingCard
              key={listing._id}
              listing={listing}
              onPreviewTrailer={handlePreviewTrailer}
              previewLoadingId={previewLoadingId}
            />
          ))}
        </div>
      ) : !loading ? (
        <div className={styles.empty}>
          <p>No listings found 😕</p>
          <p>Try a different {isSearching ? 'search term' : 'category'}</p>
        </div>
      ) : null}

      {modalOpen ? (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>AI Trailer Preview</h3>
              <button type="button" className={styles.closeBtn} onClick={closeModal}>
                ×
              </button>
            </div>

            <p className={styles.modalTitle}>{modalListingTitle}</p>

            {modalStatus === 'creating' || modalStatus === 'processing' ? (
              <p className={styles.modalText}>Generating trailer... this can take up to 30 seconds.</p>
            ) : null}

            {modalStatus === 'error' ? (
              <p className={styles.modalError}>{modalError}</p>
            ) : null}

            {modalStatus === 'done' && modalVideoUrl ? (
              <div>
                <video src={modalVideoUrl} controls className={styles.modalVideo} />
                <a href={modalVideoUrl} target="_blank" rel="noreferrer" className={styles.openLink}>
                  Open trailer in new tab
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Home