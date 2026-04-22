import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Navbar.module.css';
import { Component, Computer, LogOut, MonitorCog, User, LibraryBig } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        Daedalus
      </Link>

      <Link
        to="/builds/new"
        className={`${styles.navBtn} ${isActive('/builds/new') ? styles.navBtnActive : ''}`}
      >
        <MonitorCog />
        Build Creator
      </Link>

      <Link
        to="/components"
        className={`${styles.navBtn} ${isActive('/components') ? styles.navBtnActive : ''}`}
      >
        <Component />
        Components
      </Link>

      <Link
        to="/builds"
        className={`${styles.navBtn} ${isActive('/builds') ? styles.navBtnActive : ''}`}
      >
        <Computer />
        Public Builds
      </Link>

      {user && (
        <Link
          to="/builds/my-builds"
          className={`${styles.navBtn} ${isActive('/builds/my-builds') ? styles.navBtnActive : ''}`}
        >
          <LibraryBig />
          My Builds
        </Link>
      )}

      <div className={styles.spacer} />

      {user ? (
        <div className={styles.userMenu}>
          <button
            className={styles.userBtn}
            onClick={() => setMenuOpen(v => !v)}
          >
            <div className={styles.userAvatar}>
              {user.username[0].toUpperCase()}
            </div>
            <span className={styles.userName}>{user.username}</span>
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}
            >
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <Link
                to="/profile"
                className={styles.dropdownItem}
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} aria-hidden />
                My profile
              </Link>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={() => { setMenuOpen(false); handleLogout(); }}
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.authLinks}>
          <Link
            to="/register"
            className={`${styles.authLink} ${isActive('/register') ? styles.authLinkActive : ''}`}
          >
            Register
          </Link>
          <span className={styles.authSep}>|</span>
          <Link
            to="/login"
            className={`${styles.authLink} ${isActive('/login') ? styles.authLinkActive : ''}`}
          >
            Sign in
          </Link>
        </div>
      )}
    </nav>
  );
}