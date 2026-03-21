import { useState } from 'react'
import { listings } from '../api'

export const useListingsAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const create = async (data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await listings.create(data)
      setSuccess('Listing created successfully')
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create listing'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const update = async (id, data) => {
    try {
      setLoading(true)
      setError(null)
      const response = await listings.update(id, data)
      setSuccess('Listing updated successfully')
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update listing'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const delete_listing = async (id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await listings.delete(id)
      setSuccess('Listing deleted successfully')
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete listing'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getById = async (id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await listings.getById(id)
      return response.data.data
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch listing'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  return {
    create,
    update,
    delete: delete_listing,
    getById,
    loading,
    error,
    success,
    clearMessages,
  }
}
