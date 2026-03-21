import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listings } from '../api'
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'
import styles from './CreateListing.module.css'

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Housing', 'Misc']
const LISTING_TYPES = [
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' },
  { value: 'free', label: 'Free' },
]

function EditListing() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { uploadImage, uploading } = useCloudinaryUpload()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    type: 'sell',
  })
  const [imageFiles, setImageFiles] = useState([]) // New images to upload
  const [existingImages, setExistingImages] = useState([]) // Current images from listing
  const [imagePreviews, setImagePreviews] = useState([]) // Previews of new images
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Fetch existing listing
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await listings.getById(id)
        const listing = response.data.data

        // Check if user is the owner
        if (listing.owner.email !== user?.email) {
          setError('You can only edit your own listings')
          return
        }

        setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price || '',
          category: listing.category || 'Books',
          type: listing.type || 'sell',
        })
        setExistingImages(listing.images || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load listing')
        console.error('Error fetching listing:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchListing()
    }
  }, [id, user])

  // Redirect if not logged in
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Please <a href="/login">log in</a> to edit a listing</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error && error.includes('only edit your own')) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.error}>{error}</p>
          <button onClick={() => navigate('/')} className={styles.btn}>
            Back to Listings
          </button>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = existingImages.length + imageFiles.length + files.length
    
    // Max 5 images total
    if (totalImages > 5) {
      const canAdd = 5 - (existingImages.length + imageFiles.length)
      alert(`Maximum 5 images allowed. You can add ${canAdd} more.`)
      return
    }

    const newFiles = []
    const newPreviews = []

    files.forEach(file => {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`)
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is larger than 10MB`)
        return
      }

      newFiles.push(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result)
        if (newPreviews.length === newFiles.length) {
          setImageFiles(prev => [...prev, ...newFiles])
          setImagePreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(false)

      // Must have at least one image (existing or new)
      if (existingImages.length === 0 && imageFiles.length === 0) {
        setAttemptedSubmit(true)
        alert('Please keep at least one image or upload a new one')
        return
      }

      setSubmitting(true)
      let finalImageUrls = [...existingImages]

      // Upload new images to Cloudinary if any
      if (imageFiles.length > 0) {
        console.log(`Starting Cloudinary upload for ${imageFiles.length} new images...`)
        
        for (const file of imageFiles) {
          try {
            const url = await uploadImage(file)
            if (url) {
              finalImageUrls.push(url)
            }
          } catch (err) {
            console.error(`Failed to upload image:`, err)
          }
        }

        console.log(`✅ Uploaded ${finalImageUrls.length - existingImages.length}/${imageFiles.length} new images`)
      }

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        images: finalImageUrls, // All images (existing + new)
      }

      // Only include price for sell type
      if (formData.type === 'sell') {
        updateData.price = parseFloat(formData.price) || 0
      }

      console.log('Sending update to backend:', updateData)
      const response = await listings.update(id, updateData)
      console.log('Backend response:', response.data)

      setSuccess(true)
      setImageFiles([])
      setImagePreviews([])
      
      // Redirect to listing detail page after short delay
      setTimeout(() => {
        navigate(`/listings/${id}`)
      }, 1500)
    } catch (err) {
      console.error('Edit listing error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError(err.response?.data?.message || 'Error updating listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Edit Listing</h1>
          <p className={styles.subtitle}>Update your listing information</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Title */}
            <div className={styles.field}>
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="e.g., MacBook Air M1 — excellent condition"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            {/* Listing Type */}
            <div className={styles.field}>
              <label>Listing Type *</label>
              <div className={styles.typeButtons}>
                {LISTING_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`${styles.typeBtn} ${formData.type === t.value ? styles.active : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className={styles.field}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell buyers about your item. Condition, specs, etc."
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                rows={5}
              />
              <p className={styles.charCount}>{formData.description.length}/500</p>
            </div>

            {/* Category */}
            <div className={styles.field}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            {formData.type === 'sell' && (
              <div className={styles.field}>
                <label htmlFor="price">Price ($) *</label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            )}

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className={styles.field}>
                <label>Current Images ({existingImages.length}/5)</label>
                <div className={styles.previewGallery}>
                  <div className={styles.previewGrid}>
                    {existingImages.map((image, index) => (
                      <div key={index} className={styles.previewItem}>
                        <img src={image} alt={`Current ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className={styles.removeBtn}
                          title="Remove this image"
                        >
                          ✕
                        </button>
                        <span className={styles.imageIndex}>{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* New Image Upload */}
            {existingImages.length < 5 && (
              <div className={styles.field}>
                <label htmlFor="images">Add More Images (Max {5 - existingImages.length})</label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  multiple
                />
                <p className={styles.hint}>Max 10MB per image. Supported: JPEG, PNG, WebP, GIF.</p>
                
                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className={styles.previewGallery}>
                    <p className={styles.imageCount}>{imagePreviews.length} new images selected</p>
                    <div className={styles.previewGrid}>
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className={styles.previewItem}>
                          <img src={preview} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className={styles.removeBtn}
                            title="Remove this image"
                          >
                            ✕
                          </button>
                          <span className={styles.imageIndex}>+{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.successMsg}>✓ Listing updated successfully! Redirecting...</p>}
            {attemptedSubmit && existingImages.length === 0 && imageFiles.length === 0 && <p className={styles.error}>⚠️ Please keep at least one image</p>}

            {/* Submit */}
            <div className={styles.buttonGroup}>
              <button 
                type="submit" 
                disabled={submitting || uploading} 
                className={styles.btn}
              >
                {uploading ? 'Uploading images...' : submitting ? 'Updating...' : 'Update Listing'}
              </button>
              <button 
                type="button"
                onClick={() => navigate(`/listings/${id}`)}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditListing
