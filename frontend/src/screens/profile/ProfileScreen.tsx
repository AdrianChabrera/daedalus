import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, 
  LogOut,
  ChevronRight,
  LibraryBig,
  FolderHeart,
  FileHeart,
} from 'lucide-react';
import { API_ROUTES } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/general/ConfirmModal';
import styles from '../../styles/ProfileScreen.module.css';
import { Counter } from '../../components/general/Counter';

interface UserStats {
  buildsCount: number;
  favoriteBuildsCount: number;
  favoriteComponentsCount: number;
  reviewsCount: number;
  memberSince: string;
}

export default function ProfileScreen() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats]                     = useState<UserStats | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(API_ROUTES.USER_STATS, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((d: UserStats | null) => { if (d) setStats(d); })
      .catch(() => {});
  }, [user]);

  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.DELETE, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
      if (res.ok) {
        logout();
        navigate('/');
      } else {
        alert('Error deleting profile');
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid"  aria-hidden />

      <div className={styles.inner}>

        <h1 className={styles.pageTitle}>Personal Area</h1>

        {/* ── Stats ── */}
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Stats</span>
            <div className={styles.sectionLine} />
          </div>
          <div className={styles.statsGrid}>

            <div className={styles.identCard}>
              <div className={styles.username}>{user?.username}</div>
              {memberSince && (
                <div className={styles.memberSince}>
                  Member since <span>{memberSince}</span>
                </div>
              )}
            </div>

            <div className={styles.statCard}>
              <div className={styles.statValue}>
                <Counter target={stats?.buildsCount ?? null} />
              </div>
              <div className={styles.statLabel}>Builds</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                <Counter target={stats?.favoriteBuildsCount ?? null} />
              </div>
              <div className={styles.statLabel}>Favorite Builds</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                <Counter target={stats?.favoriteComponentsCount ?? null} />
              </div>
              <div className={styles.statLabel}>Favorite components</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                <Counter target={stats?.reviewsCount ?? null} />
              </div>
              <div className={styles.statLabel}>Reviews</div>
            </div>

          </div>
        </div>

        {/* ── Quick access ── */}
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Quick access</span>
            <div className={styles.sectionLine} />
          </div>
          <div className={styles.accessGrid}>

            <button className={styles.accessCard} onClick={() => navigate('/builds/my-builds')}>
              <div className={styles.accessIconWrap}><LibraryBig aria-hidden /></div>
              <div>
                <div className={styles.accessTitle}>My Builds</div>
                <div className={styles.accessSub}>Browse and manage your PC builds</div>
              </div>
              <ChevronRight className={styles.accessArrow} aria-hidden />
            </button>

            <button className={styles.accessCard} onClick={() => navigate('/favorites/builds')}>
              <div className={styles.accessIconWrap}><FolderHeart aria-hidden /></div>
              <div>
                <div className={styles.accessTitle}>Favorite Builds</div>
                <div className={styles.accessSub}>Browse across the builds you saved as favorites</div>
              </div>
              <ChevronRight className={styles.accessArrow} aria-hidden />
            </button>

            <button className={styles.accessCard} onClick={() => navigate('/favorites/components')}>
              <div className={styles.accessIconWrap}><FileHeart aria-hidden /></div>
              <div>
                <div className={styles.accessTitle}>Favorite Components</div>
                <div className={styles.accessSub}>Browse across the components you saved as favorites</div>
              </div>
              <ChevronRight className={styles.accessArrow} aria-hidden />
            </button>

            <button className={styles.accessCard} onClick={() => navigate('/my-reviews')}>
              <div className={styles.accessIconWrap}><MessageSquare aria-hidden /></div>
              <div>
                <div className={styles.accessTitle}>My Reviews</div>
                <div className={styles.accessSub}>Browse and manage your reviews</div>
              </div>
              <ChevronRight className={styles.accessArrow} aria-hidden />
            </button>

          </div>
        </div>

        {/* ── Account actions ── */}
        <div>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Account actions</span>
            <div className={styles.sectionLine} />
          </div>
          <div className={styles.accessGrid}>
            <button
              className={`${styles.accessCard} ${styles.accessCardLogout}`}
              onClick={() => setLogoutModalOpen(true)}
            >
              <div className={`${styles.accessIconWrap} ${styles.accessIconWrapLogout}`}>
                <LogOut aria-hidden />
              </div>
              <div>
                <div className={styles.accessTitle}>Sign out</div>
                <div className={styles.accessSub}>End your current session</div>
              </div>
              <ChevronRight className={styles.accessArrow} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className={styles.dangerZone}>
          <div className={styles.dangerZoneHeader}>
            <span className={styles.dangerZoneTitle}>Danger zone</span>
            <div className={styles.dangerZoneLine} />
          </div>

          <div className={styles.dangerZoneBody}>
            <div className={styles.dangerZoneInfo}>
              <div className={styles.dangerZoneLabel}>Delete account</div>
              <div className={styles.dangerZoneDesc}>
                Permanently removes your profile, builds, reviews and all associated data
              </div>
              <label className={styles.dangerConfirmRow}>
                <input
                  type="checkbox"
                  className={styles.dangerCheckbox}
                  checked={deleteConfirmed}
                  onChange={e => setDeleteConfirmed(e.target.checked)}
                />
                <span className={styles.dangerConfirmLabel}>
                  I understand this action is permanent and cannot be undone
                </span>
              </label>
            </div>
            <button
              className={`${styles.deleteBtn} ${deleteConfirmed ? styles.deleteBtnActive : ''}`}
              onClick={() => deleteConfirmed && setDeleteModalOpen(true)}
              disabled={loading}
              aria-disabled={!deleteConfirmed}
            >
              Delete account
            </button>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Sign out"
        description="Are you sure you want to end your current session?"
        confirmLabel="Yes, sign out"
        variant="warning"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        loading={loading}
        title="Delete account"
        description={
          <>
            This action is <strong>permanent and irreversible</strong>. Your profile,
            builds, reviews and all associated data will be deleted immediately.
          </>
        }
        confirmLabel="Yes, delete my account"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}