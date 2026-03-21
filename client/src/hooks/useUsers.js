import { useState, useEffect } from 'react'
import { users } from '../api'

export const useUsers = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const response = await users.getAll()
      setData(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllWithListings = async () => {
    try {
      setLoading(true)
      const response = await users.getAllWithListings()
      setData(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users with listings')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMe = async () => {
    try {
      setLoading(true)
      const response = await users.getMe()
      setData(response.data.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch current user')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return { 
    data, 
    loading, 
    error, 
    fetchAll, 
    fetchAllWithListings, 
    fetchMe 
  }
}
