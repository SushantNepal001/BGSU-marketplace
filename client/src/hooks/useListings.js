import { useState, useEffect } from 'react'
import api from '../api'

function useListings(filters = {}) {
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)

        // Build query string from filters
        const params = new URLSearchParams()
        if (filters.category && filters.category !== 'All') {
          params.append('category', filters.category)
        }
        if (filters.search) {
          params.append('search', filters.search)
        }

        const res = await api.get(`/listings?${params.toString()}`)
        
        // His API wraps the array inside res.data.data
        setListings(res.data.data)

      } catch (err) {
        setError('Failed to load listings')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [filters.category, filters.search])

  return { listings, loading, error }
}

export default useListings