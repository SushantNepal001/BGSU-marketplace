import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

function Navbar({ onSearch }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className={styles.nav}>

      {/* Logo + App name */}
      <Link to="/" className={styles.brand}>
        <div className={styles.logo}>S&S</div>
        <span className={styles.name}>
          BGSU <span>Swap&Shop</span>
        </span>
      </Link>

      {/* Search bar */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="text"
          placeholder="Search listings — books, furniture, electronics..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      {/* Right side actions */}
      <div className={styles.actions}>
        {user ? (
          <>
            <Link to="/listings/new" className={styles.btnPost}>
              + Post Listing
            </Link>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.dropdown}>
                <Link to="/profile">My Profile</Link>
                <Link to="/inbox">Inbox</Link>
                <button onClick={handleLogout}>Log out</button>
              </div>
            </div>
          </>
        ) : (
          <Link to="/login" className={styles.btnPost}>
            Sign in
          </Link>
        )}
      </div>

    </nav>
  )
}

export default Navbar