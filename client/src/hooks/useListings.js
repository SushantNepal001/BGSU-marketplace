import { useState, useEffect } from 'react'
import { listings as listingsAPI } from '../api'

function useListings(filters = {}) {
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await listingsAPI.getAll(filters)
        
        // API wraps the array inside res.data.data
        setListings(res.data.data)

      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load listings'
        setError(errorMsg)
        console.error('API Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [JSON.stringify(filters)])

  return { listings, loading, error }
}

export default useListings