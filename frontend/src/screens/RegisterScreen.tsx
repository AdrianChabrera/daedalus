import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthScreen.module.css';
import { Eye, EyeOff, AlertCircle, User, Lock, Check, X } from 'lucide-react';

export default function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const passwordStrength = (pw: string) => {
  if (pw.length === 0) return 0;
  if (pw.length < 8) return 1; 

  const hasUpper = /[A-Z]/.test(pw);
  const hasNum   = /[0-9]/.test(pw);
  const hasSym   = /[^A-Za-z0-9]/.test(pw);
  
  const extras = [hasUpper, hasNum, hasSym].filter(Boolean).length;
  
  return 2 + extras;
};

  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Too Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthClass = ['', 'tooWeak', 'weak', 'fair', 'good', 'strong'][strength];

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
    if (password !== confirm) {
      setError('Passwords doesn\'t match');
      return;
    }

    setLoading(true);
    try {
      await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
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
          <h1 className={styles.title}>Create account</h1>
          <p className={styles.subtitle}>
            Join Daedalus community
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
              {password.length > 0 && (
                <span 
                  className={`${styles.strengthBadge} ${styles[strengthClass]}`}
                  style={{ background: 'transparent', backgroundColor: 'transparent' }}
                >
                  {strengthLabel}
                </span>
              )}
            </label>
            <div className={styles.inputWrap}>
              <Lock className={styles.inputIcon} size={20} aria-hidden />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className={styles.strengthBar}>
                {[1,2,3,4,5].map(i => (
                  <div
                    key={i}
                    className={`${styles.strengthSegment} ${i <= strength ? `${styles.strengthSegmentFilled} ${styles[strengthClass]}` : ''}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirm" className={styles.label}>
              Confirm password
            </label>
            <div className={styles.inputWrap}>
              <Lock className={styles.inputIcon} size={20} aria-hidden />
              <input
                id="confirm"
                type={showPass ? 'text' : 'password'}
                className={`${styles.input} ${confirm.length > 0 && confirm !== password ? styles.inputError : ''} ${confirm.length > 0 && confirm === password ? styles.inputSuccess : ''}`}
                placeholder="repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              {confirm.length > 0 && (
                <div className={styles.matchIcon}>
                  {confirm === password ? (
                    <Check size={20} style={{ color: 'var(--success)' }} />
                  ) : (
                    <X size={20} style={{ color: 'var(--error)' }} />
                  )}
                </div>
              )}
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
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.cardFooter}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}