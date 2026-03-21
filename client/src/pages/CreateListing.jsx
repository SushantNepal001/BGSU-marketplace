import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useListingsAPI } from '../hooks/useListingsAPI'
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'
import styles from './CreateListing.module.css'

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Housing', 'Misc']
const LISTING_TYPES = [
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' },
  { value: 'free', label: 'Free' },
]

function CreateListing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { create, loading, error, success, clearMessages } = useListingsAPI()
  const { uploadImage, uploading } = useCloudinaryUpload()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    type: 'sell',
  })
  const [imageFiles, setImageFiles] = useState([]) // Array for multiple images
  const [imagePreviews, setImagePreviews] = useState([]) // Array of previews
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Redirect if not logged in
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Please <a href="/login">log in</a> to create a listing</p>
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
    
    // Max 5 images
    if (files.length + imageFiles.length > 5) {
      alert(`Maximum 5 images allowed. You can add ${5 - imageFiles.length} more.`)
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

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      clearMessages()
      
      // Images are now required
      if (imageFiles.length === 0) {
        setAttemptedSubmit(true)
        alert('Please upload at least one image before creating the listing')
        return
      }
      
      // Upload all images to Cloudinary
      console.log(`Starting Cloudinary upload for ${imageFiles.length} images...`)
      const imageUrls = []
      
      for (const file of imageFiles) {
        try {
          const url = await uploadImage(file)
          if (url) {
            imageUrls.push(url)
          }
        } catch (err) {
          console.error(`Failed to upload image:`, err)
        }
      }

      if (imageUrls.length === 0) {
        alert('Failed to upload images to Cloudinary. Check console for details.')
        return
      }

      console.log(`✅ Uploaded ${imageUrls.length}/${imageFiles.length} images`)

      // Send listing data with images array to backend
      const listingData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        images: imageUrls, // Array of image URLs from Cloudinary
      }

      // Only include price for sell type
      if (formData.type === 'sell') {
        listingData.price = parseFloat(formData.price) || 0
      }

      console.log('Sending to backend:', listingData)
      const response = await create(listingData)
      console.log('Backend response:', response.data)
      
      // Redirect to listing detail page
      navigate(`/listings/${response.data._id}`)
    } catch (err) {
      console.error('Create listing error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        fullError: err
      })
      alert('Error creating listing: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Create a Listing</h1>
          <p className={styles.subtitle}>Sell, trade, or give away your items</p>

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

            {/* Image Upload */}
            <div className={styles.field}>
              <label htmlFor="images">Upload Images (Max 5) *</label>
              <input
                id="images"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                multiple
                required
              />
              <p className={styles.hint}>Max 10MB per image. Supported: JPEG, PNG, WebP, GIF. At least 1 image is required. Max 5 images allowed.</p>
              
              {/* Image Previews Gallery */}
              {imagePreviews.length > 0 && (
                <div className={styles.previewGallery}>
                  <p className={styles.imageCount}>{imagePreviews.length} of 5 images selected</p>
                  <div className={styles.previewGrid}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className={styles.previewItem}>
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
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
              )}
            </div>

            {/* Messages */}
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.successMsg}>{success}</p>}
            {attemptedSubmit && imageFiles.length === 0 && <p className={styles.error}>⚠️ Please upload at least one image to create a listing</p>}

            {/* Submit */}
            <button type="submit" disabled={loading || uploading || imageFiles.length === 0} className={styles.btn}>
              {uploading ? 'Uploading images...' : loading ? 'Creating listing...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateListing