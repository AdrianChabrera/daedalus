import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Star, Cpu, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBuilds } from '../../hooks/useBuilds';
import { API_ROUTES } from '../../config/api';
import styles from '../../styles/HomeScreen.module.css';
import { Counter } from '../../components/general/Counter';
import { HomeBuildCard } from '../../components/home/HomeBuildCard';

function useCount(url: string) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d != null) setCount(d); })
      .catch(() => {});
  }, [url]);
  return count;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const buildsCount     = useCount(API_ROUTES.BUILDS_COUNT);
  const componentsCount = useCount(API_ROUTES.COMPONENTS_COUNT);

  const { result } = useBuilds({
    url: API_ROUTES.PUBLIC_BUILDS,
    page: 1,
    pageSize: 5,
    order: 'rating-DESC',
    search: '',
    authToken: user?.accessToken,
  });

  const bestRatedBuilds = result?.data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.bgNoise} aria-hidden />
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Design · Build · Share</p>

          <div className={styles.heroTitleBlock}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroLine1}>Build Your</span>
              <br />
              <span className={styles.heroAccent}>Perfect</span>{' '}
              <span className={styles.heroWhite}>PC</span>
            </h1>
            <div className={styles.heroUnderline} aria-hidden />
          </div>

          <p className={styles.heroSub}>
            Browse a wide variety of community builds,<br />
            explore compatible components and share your creations.
          </p>

          <div className={styles.heroCtas}>
            <Link to="/builds/new" className={styles.ctaPrimary}>
              <Plus size={16} />
              Create a build
            </Link>
            <Link to="/builds" className={styles.ctaSecondary}>
              Browse builds
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.heroLogoWrap} aria-hidden>
          <img
            src="/src/assets/daedalus_logo.png"
            alt=""
            className={styles.heroLogoSvg}
          />
          <div className={styles.heroLogoGlow} />
        </div>
      </section>

      <div className={styles.divider} aria-hidden />

      <section className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}><Counter target={buildsCount} /></span>
          <span className={styles.statLabel}><Monitor size={12} /> BUILDS</span>
        </div>
        <div className={styles.statSep} aria-hidden />
        <div className={styles.statItem}>
          <span className={styles.statValue}><Counter target={componentsCount} /></span>
          <span className={styles.statLabel}><Cpu size={12} /> COMPONENTS</span>
        </div>
      </section>

      {bestRatedBuilds.length > 0 && (
        <section className={styles.bestRatedSection}>
          <div className={styles.bestRatedHeader}>
            <h2 className={styles.bestRatedTitle}>
              BEST RATED <span>BUILDS</span>
            </h2>
            <Link to="/builds" className={styles.viewAll}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className={styles.buildsStrip}>
            {bestRatedBuilds.map(b => (
              <HomeBuildCard
                key={b.id}
                build={b}
                onClick={() => navigate(`/builds/${b.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {!user && (
        <section className={styles.banner}>
          <div className={styles.bannerContent}>
            <Star size={22} className={styles.bannerIcon} />
            <div>
              <h3 className={styles.bannerTitle}>Join the community</h3>
              <p className={styles.bannerSub}>
                Create an account to save builds, write reviews and favourite components.
              </p>
            </div>
            <Link to="/register" className={styles.ctaPrimary}>
              Sign up free <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}