import { useRef, useEffect } from 'react';
import { Plus, Minus, Check, ChevronDown, AlertTriangle, Loader2, X } from 'lucide-react';
import { useAddToBuild } from '../../hooks/useAddToBuild';
import styles from '../../styles/AddToBuildButton.module.css';

interface Props {
  componentType: string;
  componentId: string;
  componentName: string;
}

export function AddToBuildButton({ componentType, componentId }: Props) {
  const {
    isMulti,
    isAuthenticated,
    localStatus,
    localCount,
    handleLocalAdd,
    handleLocalRemove,
    handleConfirmReplace,
    handleCancelReplace,
    userBuilds,
    dropdownOpen,
    loadingBuilds,
    buildStatuses,
    openBuildsDropdown,
    assignToUserBuild,
    closeDropdown,
  } = useAddToBuild(componentType, componentId);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen, closeDropdown]);

  if (localStatus === 'confirm-replace') {
    return (
      <div className={styles.confirmWrapper}>
        <div className={styles.confirmActions}>
          <button className={styles.confirmBtn} onClick={handleConfirmReplace}>
            Replace
          </button>
          <button className={styles.cancelBtn} onClick={handleCancelReplace}>
            Cancel
          </button>
          <div className={styles.confirmWarning}>
            <AlertTriangle size={14} />
            <span>This slot already has a component. Replace it?</span>
          </div>
        </div>
      </div>
    );
  }

  const isInLocalBuild = localStatus === 'in-build';

  return (
    <div className={styles.root}>
      {isMulti ? (
        <div className={styles.multiControl}>
          {localCount > 0 && (
            <button
              className={styles.multiStepBtn}
              onClick={handleLocalRemove}
              aria-label="Remove one from build"
            >
              {localCount === 1 ? <X size={14} /> : <Minus size={14} />}
            </button>
          )}

          <button
            className={`${styles.addToBuildBtn} ${localCount > 0 ? styles.inBuild : ''}`}
            onClick={handleLocalAdd}
            aria-label={localCount > 0 ? 'Add another to build' : 'Add to build'}
          >
            <Plus size={16} />
            {localCount > 0 ? (
              <>
                In build
                <span className={styles.badge}>{localCount}</span>
              </>
            ) : (
              'Add to build'
            )}
          </button>
        </div>
      ) : (
        <button
          className={`${styles.addToBuildBtn} ${isInLocalBuild ? styles.inBuild : ''}`}
          onClick={handleLocalAdd}
          aria-label={isInLocalBuild ? 'Remove from build' : 'Add to build'}
        >
          {isInLocalBuild ? (
            <>
              <Check size={16} />
              In build
            </>
          ) : (
            <>
              <Plus size={16} />
              Add to build
            </>
          )}
        </button>
      )}

      {isAuthenticated && (
        <div className={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            className={`${styles.dropdownToggle} ${dropdownOpen ? styles.dropdownToggleOpen : ''}`}
            onClick={openBuildsDropdown}
            aria-label="Assign to one of your builds"
            title="Add to a specific build"
          >
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <p className={styles.dropdownTitle}>Add to one of your builds</p>

              {loadingBuilds ? (
                <div className={styles.dropdownLoading}>
                  <Loader2 size={14} className={styles.spinnerIcon} />
                  <span>Loading builds…</span>
                </div>
              ) : userBuilds.length === 0 ? (
                <p className={styles.dropdownEmpty}>No builds found.</p>
              ) : (
                <ul className={styles.buildList}>
                  {userBuilds.map(build => {
                    const status = buildStatuses[build.id];
                    return (
                      <li key={build.id} className={styles.buildItem}>
                        <button
                          className={`${styles.buildBtn} ${status === 'done' ? styles.buildBtnDone : ''} ${status === 'error' ? styles.buildBtnError : ''}`}
                          onClick={() => assignToUserBuild(build.id)}
                          disabled={status === 'loading' || status === 'done'}
                        >
                          <span className={styles.buildName}>{build.name}</span>
                          <span className={styles.buildBtnStatus}>
                            {status === 'loading' && <Loader2 size={12} className={styles.spinnerIcon} />}
                            {status === 'done' && <Check size={12} />}
                            {status === 'error' && <span className={styles.errorText}>Error</span>}
                            {!status && <Plus size={12} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}