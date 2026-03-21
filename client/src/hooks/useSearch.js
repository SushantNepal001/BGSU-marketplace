import { useState, useEffect } from 'react'
import { listings } from '../api'

export const useSearch = (query, debounceDelay = 500) => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Skip if query is empty
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    // Debounce timer
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`🔍 Searching for: "${query}"`)
        
        // Call backend search API with q parameter
        const response = await listings.search(query)
        
        console.log('✅ Search response:', response)
        
        // Response structure: { listings: [...], totalResults, currentPage, totalPages }
        const data = response.data.listings || []
        setResults(Array.isArray(data) ? data : [])
        
        console.log(`✅ Found ${data.length} results for "${query}"`)
      } catch (err) {
        console.error('❌ Search error:', err)
        const errorMsg = err.response?.data?.message || err.message || 'Failed to search listings'
        setError(errorMsg)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, debounceDelay)

    return () => clearTimeout(timer)
  }, [query, debounceDelay])

  return { results, loading, error }
}
