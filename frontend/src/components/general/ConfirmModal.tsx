import styles from '../../styles/ConfirmModal.module.css';

interface ConfirmModalProps {
  isOpen: boolean;
  loading?: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger:  { accent: '#E24B4A', icon: '⚠' },
  warning: { accent: '#EF9F27', icon: '⚠' },
  info:    { accent: '#378ADD', icon: 'ℹ' },
};

export default function ConfirmModal({
  isOpen,
  loading = false,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const { accent, icon } = VARIANT_STYLES[variant];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
  className={styles.modal}
  style={{ '--modal-accent': accent } as React.CSSProperties}
  onClick={(e) => e.stopPropagation()}
>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <span className={styles.icon}>{icon}</span>
          </div>
          <h2 className={styles.title}>{title}</h2>

        </div>
        <p className={styles.desc}>{description}</p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {loading
              ? <><div className={styles.spinner} /> Processing…</>
              : confirmLabel
            }
          </button>
        </div>

      </div>
    </div>
  );
}