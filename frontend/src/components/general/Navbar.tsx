  import { Link, useLocation } from 'react-router-dom';
  import { useAuth } from '../../context/AuthContext';
  import styles from '../../styles/Navbar.module.css';
  import { Component, Computer, MonitorCog, User, LibraryBig } from 'lucide-react';
  import logo from '../../assets/daedalus_logo.png';


  export default function Navbar() {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="Daedalus logo" className={styles.logoImg} />
          <div className={styles.logoTitle}>
            Daedalus
          </div>
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
          <Link
            to="/profile"
            className={`${styles.navBtn} ${isActive('/profile') ? styles.navBtnActive : ''}`}
          >
            <User />
            Personal Area
          </Link>
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