import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useListingsAPI } from '../hooks/useListingsAPI'
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'
import styles from './CreateListing.module.css'

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Housing', 'Misc']

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
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

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
    const file = e.target.files[0]
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB')
        return
      }
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      clearMessages()
      
      let imageUrl = null
      
      // Upload image to Cloudinary if selected
      if (imageFile) {
        console.log('Starting Cloudinary upload...')
        imageUrl = await uploadImage(imageFile)
        console.log('Image URL from Cloudinary:', imageUrl)
        
        if (!imageUrl) {
          alert('Failed to upload image to Cloudinary. Check console for details.')
          return
        }
      }

      // Send listing data with imageUrl to backend
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price), // Convert to number
        category: formData.category,
        imageUrl: imageUrl, // Just the URL string
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

            {/* Image Upload */}
            <div className={styles.field}>
              <label htmlFor="image">Upload Image</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className={styles.hint}>Max 10MB. Supported: JPEG, PNG, WebP, GIF</p>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className={styles.preview}>
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className={styles.removeImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.successMsg}>{success}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading || uploading} className={styles.btn}>
              {uploading ? 'Uploading image...' : loading ? 'Creating listing...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateListing