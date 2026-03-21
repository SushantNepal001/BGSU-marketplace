import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await loginUser(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

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
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="your.email@bgsu.edu"
                pattern=".+@bgsu\.edu$"
                title="Please use your BGSU email (e.g., john@bgsu.edu)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className={styles.footer}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
