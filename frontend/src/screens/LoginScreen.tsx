import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthScreen.module.css';
import { Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';


export default function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (password.length < 8) {
      setError('The password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        setError('Wrong username or password');
      } else {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Login</h1>
          <p className={styles.subtitle}>
            Access your Daedalus account
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={20} aria-hidden />
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <div className={styles.inputWrap}>
              <User className={styles.inputIcon} size={20} aria-hidden />
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrap}>
              <Lock className={styles.inputIcon} size={20} aria-hidden/>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? (
                  <EyeOff size={20} aria-hidden />
                ) : (
                  <Eye size={20} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} aria-hidden />
                Accessing...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className={styles.cardFooter}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.footerLink}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}