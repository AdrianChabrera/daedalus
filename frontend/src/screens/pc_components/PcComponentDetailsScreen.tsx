import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, PenLine } from 'lucide-react';
import { API_ROUTES } from '../../config/api';
import type { PcComponent } from '../../types/PcComponents.types';
import styles from '../../styles/PcComponentDetailsScreen.module.css';
import { AttributeTooltip } from '../../components/pc_components/AttributeTooltip';
import { BASE_ATTRS, COMPONENT_ATTRS } from '../../consts/PcComponentAttributeDetails';
import { str } from '../../consts/PcComponentAttributeFormatters';
import type { M2SlotData, PcieSlotData } from '../../types/PcComponentDetails.types';
import { AddToBuildButton } from '../../components/pc_components/AddToBuildButton';

function ImagePlaceholder() {
  return <div>TODO Add placeholder</div>;
}

export default function ComponentDetailScreen() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<PcComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) return;
    let cancelled = false;

    const fetchComponent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ROUTES.COMPONENT(type, id));
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PcComponent = await res.json();
        if (!cancelled) setComponent(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchComponent();
    return () => { cancelled = true; };
  }, [type, id]);

  const attrs = type ? (COMPONENT_ATTRS[type] ?? BASE_ATTRS) : BASE_ATTRS;

  const availableLogos = import.meta.glob('../../assets/logos/*.svg', { eager: true });
  const manufacturerName = component?.manufacturer ? component.manufacturer.toLowerCase() : '';
  const route = `../../assets/logos/${manufacturerName}.svg`;
  const logoExists = !!availableLogos[route];
  const logo = logoExists ? new URL(route, import.meta.url).href : undefined;

  const m2Slots: M2SlotData[] = (component as (PcComponent & { m2Slots?: M2SlotData[] }) | null)?.m2Slots ?? [];
  const pcieSlots: PcieSlotData[] = (component as (PcComponent & { pcieSlots?: PcieSlotData[] }) | null)?.pcieSlots ?? [];

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
            <p className={styles.errorText}>Could not load component: {error}</p>
          </div>
        )}

        {!loading && !error && component && (
          <>
            <div className={styles.hero}>
              <div className={styles.heroImage}>
                {logoExists ? (
                  <img src={logo} alt={component.manufacturer ?? ''} className={styles.heroLogo} />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              <div className={styles.heroInfo}>
                <h1 className={styles.heroTitle}>{component.name ?? '—'}</h1>

                <div className={styles.ratingContainer} aria-label="Rating — not yet implemented">
                  <div className={styles.starsPlaceholder}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={styles.starEmpty}>★</span>
                    ))}
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <button
                    className={styles.favouriteBtn}
                    disabled
                    aria-label="Add to favourites — not yet implemented"
                  >
                    <Heart size={18} />
                  </button>

                 {type && id && component.name && (
                    <AddToBuildButton
                      componentType={type}
                      componentId={id}
                      componentName={component.name}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className={styles.mainContent}>

              <section className={styles.techSection}>
                <h2 className={styles.sectionTitle}>Technical details</h2>

                <table className={styles.attrTable}>
                  <tbody>
                    {attrs.map(({ key, label, format, description }) => {
                      const raw = component[key];
                      const display = format ? format(raw) : str(raw);
                      return (
                        <tr key={key} className={styles.attrRow}>
                          <td className={styles.attrLabel}>
                            <span className={styles.attrLabelText}>{label}</span>
                            {description && <AttributeTooltip description={description} />}
                          </td>
                          <td className={styles.attrValue}>{display}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {type === 'motherboard' && m2Slots.length > 0 && (
                  <div className={styles.subTableWrapper}>
                    <h3 className={styles.subTableTitle}>M.2 Slots</h3>
                    <table className={styles.subTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Size</th>
                          <th>Key</th>
                          <th>Interface</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m2Slots.map((slot, i) => (
                          <tr key={slot.id}>
                            <td>{i + 1}</td>
                            <td>{slot.size ?? '—'}</td>
                            <td>{slot.key ?? '—'}</td>
                            <td>{slot.m2Interface ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {type === 'motherboard' && pcieSlots.length > 0 && (
                  <div className={styles.subTableWrapper}>
                    <h3 className={styles.subTableTitle}>PCIe Slots</h3>
                    <table className={styles.subTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Gen</th>
                          <th>Lanes</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcieSlots.map((slot, i) => (
                          <tr key={slot.id}>
                            <td>{i + 1}</td>
                            <td>{slot.gen ?? '—'}</td>
                            <td>{slot.lanes != null ? `×${slot.lanes}` : '—'}</td>
                            <td>{slot.quantity ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

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
          </>
        )}
      </div>
    </div>
  );
}