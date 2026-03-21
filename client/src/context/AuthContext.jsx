import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on page load
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const loginUser = async (email, password) => {
    try {
      const response = await auth.login(email, password)
      login(response.data.user, response.data.token)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const registerUser = async (name, email, password) => {
    try {
      const response = await auth.register(name, email, password)
      login(response.data.user, response.data.token)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, loginUser, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use this anywhere you need user info
export function useAuth() {
  return useContext(AuthContext)
}