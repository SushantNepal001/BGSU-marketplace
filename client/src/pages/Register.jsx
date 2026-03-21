import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Register.module.css'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { registerUser } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    // Check name
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return false
    }

    // Check email
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }

    if (!formData.email.endsWith('@bgsu.edu')) {
      setError('Please use your BGSU email (e.g., john@bgsu.edu)')
      return false
    }

    // Check password
    if (!formData.password) {
      setError('Password is required')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    // Check confirm password
    if (!formData.confirmPassword) {
      setError('Please confirm your password')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setError('')
      setLoading(true)
      await registerUser(formData.name, formData.email, formData.password)
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Sign up failed'
      setError(message)
      console.error('Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Logo */}
          <div className={styles.branding}>
            <div className={styles.logo}>S&S</div>
            <h1>BGSU Swap & Shop</h1>
          </div>

          {/* Form */}
          <h2>Create Account</h2>
          <p className={styles.subtitle}>Join the BGSU marketplace</p>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className={styles.field}>
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label>BGSU Email *</label>
              <input
                type="email"
                name="email"
                placeholder="your.email@bgsu.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <p className={styles.hint}>Must be a valid @bgsu.edu email</p>
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className={styles.hint}>At least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className={styles.field}>
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Error */}
            {error && <p className={styles.error}>{error}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer */}
          <p className={styles.footer}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          {/* Terms */}
          <p className={styles.terms}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
