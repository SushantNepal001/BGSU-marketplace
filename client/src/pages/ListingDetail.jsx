import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listings } from '../api'
import { useAuth } from '../context/AuthContext'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import styles from './ListingDetail.module.css'

function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewRefresh, setReviewRefresh] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await listings.getById(id)
        setListing(response.data.data)
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError(err.response?.data?.message || 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  const handleDeleteListing = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this listing? This action cannot be undone.'
    )
    
    if (!confirmed) return

    try {
      setDeleting(true)
      await listings.delete(id)
      
      // Redirect to home after successful deletion
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1000)
    } catch (err) {
      console.error('Error deleting listing:', err)
      alert(err.response?.data?.message || 'Failed to delete listing')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.loading}>Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <p>{error || 'Listing not found'}</p>
            <button onClick={() => navigate('/')} className={styles.btn}>
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = user && user.email === listing.owner.email

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back button */}
        <button onClick={() => navigate('/')} className={styles.backBtn}>
          ← Back
        </button>

        <div className={styles.grid}>
          {/* Image section */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} />
              ) : (
                <div className={styles.noImage}>No image</div>
              )}
            </div>
            <p className={styles.badge}>{listing.category}</p>
          </div>

          {/* Details section */}
          <div className={styles.detailsSection}>
            <h1 className={styles.title}>{listing.title}</h1>

            {/* Price */}
            <p className={styles.price}>
              {listing.type === 'free' 
                ? 'Free' 
                : listing.type === 'trade' 
                ? 'Trade' 
                : `$${listing.price ? listing.price.toFixed(2) : '0.00'}`}
            </p>

            {/* Description */}
            <div className={styles.section}>
              <h2>Description</h2>
              <p className={styles.description}>{listing.description || 'No description provided'}</p>
            </div>

            {/* Listing info */}
            <div className={styles.section}>
              <h2>Listing Details</h2>
              <div className={styles.info}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Category:</span>
                  <span className={styles.value}>{listing.category}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{listing.type || 'Sell'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Posted:</span>
                  <span className={styles.value}>
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className={styles.section}>
              <h2>Seller</h2>
              <div className={styles.seller}>
                <div className={styles.avatar}>
                  {listing.owner.name?.charAt(0).toUpperCase()}
                </div>
                <div className={styles.sellerInfo}>
                  <p className={styles.sellerName}>{listing.owner.name}</p>
                  <p className={styles.sellerEmail}>{listing.owner.email}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              {isOwner ? (
                <>
                  <button 
                    className={styles.btnPrimary}
                    onClick={() => navigate(`/listings/${id}/edit`)}
                  >
                    Edit Listing
                  </button>
                  <button 
                    className={styles.btnDanger}
                    onClick={handleDeleteListing}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Listing'}
                  </button>
                </>
              ) : user ? (
                <button className={styles.btnPrimary}>Contact Seller</button>
              ) : (
                <button 
                  className={styles.btnPrimary}
                  onClick={() => navigate('/login')}
                >
                  Sign in to Contact
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <ReviewList 
            listingId={id} 
            refreshTrigger={reviewRefresh}
          />

          {user && !isOwner ? (
            <ReviewForm 
              listingId={id} 
              sellerId={listing.owner._id}
              onReviewSubmitted={() => setReviewRefresh(prev => prev + 1)}
            />
          ) : !user ? (
            <div className={styles.loginPrompt}>
              <p>Please <button onClick={() => navigate('/login')} className={styles.inlineLink}>sign in</button> to leave a review.</p>
            </div>
          ) : (
            <div className={styles.ownerNote}>
              <p>You cannot review your own listing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListingDetail