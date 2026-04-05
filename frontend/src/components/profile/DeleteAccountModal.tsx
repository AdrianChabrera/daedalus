import styles from '../../styles/DeleteAccountModal.module.css';

interface Props {
  isOpen: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteAccountModal({ isOpen, loading, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.topBar} />

        <div className={styles.iconWrap}>
          <span className={styles.icon}>⚠</span>
        </div>

        <h2 className={styles.title}>Delete account</h2>
        <p className={styles.desc}>
          This action is <strong>permanent and irreversible</strong>. Your profile, builds, and all associated data will be deleted immediately.
        </p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {loading
              ? <><div className={styles.spinner} /> Deleting…</>
              : 'Yes, delete my account'
            }
          </button>
        </div>
      </div>
    </div>
  );
}