import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import styles from '../../styles/BuildPhotoUpload.module.css';
import type { BuildPhotoUploadProps } from '../../types/CreateBuildTypes';

export function BuildPhotoUpload({
  currentPhotoUrl,
  uploading = false,
  deleting = false,
  error,
  onFileSelect,
  onDelete,
  validateFile,
}: BuildPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);

    if (validateFile) {
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        e.target.value = '';
        return;
      }
    }

    onFileSelect(file);
    e.target.value = '';
  };

  const displayError = error ?? localError;
  const busy = uploading || deleting;

  return (
    <div className={styles.root}>
      <div className={styles.preview}>
        {currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt="Build photo" className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={32} className={styles.placeholderIcon} />
            <span className={styles.placeholderText}>No photo</span>
          </div>
        )}

        {busy && (
          <div className={styles.overlay}>
            <Loader2 size={24} className={styles.spinner} />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <ImagePlus size={14} />
          {currentPhotoUrl ? 'Replace photo' : 'Add photo'}
        </button>

        {currentPhotoUrl && onDelete && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onDelete}
            disabled={busy}
          >
            <X size={14} />
            Remove
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </div>

      {displayError && (
        <p className={styles.error}>{displayError}</p>
      )}

      <p className={styles.hint}>JPEG, PNG or WebP · max 8 MB</p>
    </div>
  );
}
