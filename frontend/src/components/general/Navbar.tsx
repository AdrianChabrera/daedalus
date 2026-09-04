import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Navbar.module.css';
import { Component, Computer, MonitorCog, User, Menu, X } from 'lucide-react';
import logo from '../../assets/daedalus_logo.png';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <nav className={styles.nav} ref={navRef}>
      <Link to="/" className={styles.logo} onClick={closeMenu}>
        <img src={logo} alt="Daedalus logo" className={styles.logoImg} />
        <div className={styles.logoTitle}>Daedalus</div>
      </Link>

      <button
        type="button"
        className={styles.menuToggle}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(o => !o)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
        <Link
          to="/builds/new"
          className={`${styles.navBtn} ${isActive('/builds/new') ? styles.navBtnActive : ''}`}
          onClick={closeMenu}
        >
          <MonitorCog />
          Build Creator
        </Link>

        <Link
          to="/components"
          className={`${styles.navBtn} ${isActive('/components') ? styles.navBtnActive : ''}`}
          onClick={closeMenu}
        >
          <Component />
          Components
        </Link>

        <Link
          to="/builds"
          className={`${styles.navBtn} ${isActive('/builds') ? styles.navBtnActive : ''}`}
          onClick={closeMenu}
        >
          <Computer />
          Public Builds
        </Link>

        <div className={styles.spacer} />

        {user ? (
          <Link
            to="/profile"
            className={`${styles.navBtn} ${isActive('/profile') ? styles.navBtnActive : ''}`}
            onClick={closeMenu}
          >
            <User />
            Profile
          </Link>
        ) : (
          <div className={styles.authLinks}>
            <Link
              to="/register"
              className={`${styles.authLink} ${isActive('/register') ? styles.authLinkActive : ''}`}
              onClick={closeMenu}
            >
              Register
            </Link>
            <span className={styles.authSep}>|</span>
            <Link
              to="/login"
              className={`${styles.authLink} ${isActive('/login') ? styles.authLinkActive : ''}`}
              onClick={closeMenu}
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}