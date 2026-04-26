import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, FileText, PenLine, Pencil, Trash2 } from 'lucide-react';
import { API_ROUTES } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/BuildDetailsScreen.module.css';
import { CREATE_BUILD_SLOTS } from '../../consts/CreateBuildConsts';
import type { BuildComponent, BuildDetail, BuildMultiEntry, ComponentRowProps } from '../../types/BuildDetails.type';
import { SLOT_TO_API } from '../../consts/BuildDetailsConsts';
import { BuildDetailsComponentSlotRow } from '../../components/builds/BuildDetailsComponentSlotRow';
import ConfirmModal from '../../components/general/ConfirmModal';

export default function BuildDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchBuild = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (user?.accessToken) headers['Authorization'] = `Bearer ${user.accessToken}`;
        const res = await fetch(API_ROUTES.GET_BUILD(Number(id)), { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: BuildDetail = await res.json();
        if (!cancelled) setBuild(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBuild();
    return () => { cancelled = true; };
  }, [id, user]);

  const isOwner = !!user && !!build && user.username === build.username;
  const isOwnerAndNotPublished = isOwner && !build.published;

  const handleDelete = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.DELETE_BUILD(Number(id)), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      navigate('/builds/my-builds');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const rows: ComponentRowProps[] = [];

  if (build) {
    for (const slot of CREATE_BUILD_SLOTS) {
      const mapping = SLOT_TO_API[slot.key];
      if (!mapping) continue;

      if (mapping.single) {
        const comp = (build as unknown as Record<string, BuildComponent | undefined>)[mapping.single];
        if (comp) {
          rows.push({
            icon: slot.icon,
            label: slot.label,
            component: comp,
            specs: slot.specs,
            endpoint: mapping.endpoint,
          });
        }
      } else if (mapping.multi) {
        const entries = (build as unknown as Record<string, BuildMultiEntry[] | undefined>)[mapping.multi] ?? [];
        for (const entry of entries) {
          rows.push({
            icon: slot.icon,
            label: slot.label,
            component: entry.component,
            specs: slot.specs,
            endpoint: mapping.endpoint,
            quantity: entry.quantity,
          });
        }
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.inner}>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          Back
        </button>

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>Could not load build: {error}</p>
          </div>
        )}

        {!loading && !error && build && (
          <>
            <div className={styles.hero}>
              <div className={styles.heroBuildImage}>
                {build.photoUrl ? (
                  <img src={build.photoUrl} alt={build.name} className={styles.buildPhoto} />
                ) : (
                  <div className={styles.buildPhotoPlaceholder}>
                    <span className={styles.buildPhotoPlaceholderText}>No image</span>
                  </div>
                )}
              </div>

              <div className={styles.heroInfo}>
                <h1 className={styles.heroTitle}>{build.name}</h1>

                <div className={styles.ratingContainer} aria-label="Rating — not yet implemented">
                  <div className={styles.starsPlaceholder}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={styles.starEmpty}>★</span>
                    ))}
                  </div>
                  <span className={styles.ratingNote}>(0)</span>
                </div>

                {build.username && (
                  <span className={styles.authorBadge}>by {build.username}</span>
                )}

                <div className={styles.heroActions}>
                  <button
                    className={styles.favouriteBtn}
                    disabled
                    aria-label="Add to favourites — not yet implemented"
                  >
                    <Heart size={18} />
                  </button>

                  <button
                    className={styles.exportBtn}
                    disabled
                    aria-label="Export to PDF — not yet implemented"
                  >
                    <FileText size={16} />
                    Export to PDF
                  </button>

                  {isOwnerAndNotPublished && (
                    <button
                      className={styles.ownerBtnEdit}
                      onClick={() => navigate(`/builds/${id}/edit`)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  )}
                  {isOwner && (
                    <button
                      className={styles.ownerBtnDelete}
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={actionLoading}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
                {actionError && <span className={styles.actionError}>{actionError}</span>}
              </div>
            </div>

            <div className={styles.mainContent}>

              <section className={styles.componentsSection}>
                <h2 className={styles.sectionTitle}>Components list</h2>

                <div className={styles.componentsList}>
                  {rows.length === 0 ? (
                    <p className={styles.emptyComponents}>No components in this build.</p>
                  ) : (
                    rows.map((row, i) => (
                      <BuildDetailsComponentSlotRow key={i} {...row} />
                    ))
                  )}
                </div>
              </section>

              <div className={styles.rightColumn}>

                {build.description && (
                  <section className={styles.descriptionSection}>
                    <h2 className={styles.sectionTitle}>Description</h2>
                    <p className={styles.descriptionText}>{build.description}</p>
                  </section>
                )}

                <section className={styles.reviewsSection}>
                  <div className={styles.reviewsHeader}>
                    <h2 className={styles.sectionTitle}>Reviews</h2>
                    <button
                      className={styles.writeReviewBtn}
                      disabled
                      aria-label="Write a review — not yet implemented"
                    >
                      <PenLine size={14} />
                      Write a review
                    </button>
                  </div>

                  <div className={styles.reviewsPlaceholder}>
                    <p className={styles.reviewsEmpty}>No reviews yet.</p>
                  </div>
                </section>

              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        loading={actionLoading}
        title="Delete build"
        description={<>This action is <strong>permanent</strong> and cannot be undone.</>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}