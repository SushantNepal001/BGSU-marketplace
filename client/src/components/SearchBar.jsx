import styles from './SearchBar.module.css'

function SearchBar({ value, onChange, placeholder = 'Search listings...', loading = false }) {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        />
        {loading && <span className={styles.loader}>⟳</span>}
        {value && !loading && (
          <button
            className={styles.clearBtn}
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchBar
