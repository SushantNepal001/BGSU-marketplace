import { useState } from 'react'
import { auth } from '../api'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const register = async (name, email, password) => {
    try {
      setLoading(true)
      setError(null)
      const response = await auth.register(name, email, password)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const response = await auth.login(email, password)
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { register, login, loading, error }
}
