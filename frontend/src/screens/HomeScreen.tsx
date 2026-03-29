import { useAuth } from '../context/AuthContext';
import styles from './HomeScreen.module.css';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.content}>
        <h1 className={styles.title}>
          Hello, <span>{user?.username ?? 'Guest'}</span>
        </h1>
        <p className={styles.desc}>
          Home Page. To be implemented.
        </p>
      </div>
    </div>
  );
}