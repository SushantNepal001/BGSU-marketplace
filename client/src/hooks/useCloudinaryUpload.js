import { useState } from 'react'

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const uploadImage = async (file) => {
    if (!file) return null

    setUploading(true)
    setError(null)

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

      console.log('Uploading to Cloudinary...', { cloudName, uploadPreset })

      if (!cloudName || !uploadPreset) {
        throw new Error('Missing Cloudinary credentials in .env')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      console.log('Upload URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      console.log('Cloudinary response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Cloudinary error:', errorData)
        throw new Error(errorData.error?.message || 'Failed to upload image')
      }

      const data = await response.json()
      console.log('Cloudinary success! URL:', data.secure_url)
      
      setUploading(false)
      return data.secure_url
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
      setUploading(false)
      return null
    }
  }

  return { uploadImage, uploading, error }
}
