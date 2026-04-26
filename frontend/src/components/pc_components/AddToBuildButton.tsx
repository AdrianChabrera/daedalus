import { useRef, useEffect } from 'react';
import { Plus, Check, ChevronDown, AlertTriangle, Loader2, Minus } from 'lucide-react';
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
    buildOpStatus,
    openBuildsDropdown,
    addToExistingBuild,
    removeFromExistingBuild,
    requestReplaceForBuild,
    cancelReplaceForBuild,
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
      {isMulti && localCount > 0 ? (
        <div className={styles.stepper}>
          <button
            className={styles.stepperBtn}
            onClick={handleLocalRemove}
            aria-label="Remove one from build"
          >
            <Minus size={14} />
          </button>
          <span className={styles.stepperCount}>{localCount}</span>
          <button
            className={styles.stepperBtn}
            onClick={handleLocalAdd}
            aria-label="Add one more to build"
          >
            <Plus size={14} />
          </button>
        </div>
      ) : (
        <button
          className={`${styles.addToBuildBtn} ${isInLocalBuild ? styles.inBuild : ''}`}
          onClick={handleLocalAdd}
          aria-label={isInLocalBuild ? 'Already in your build' : 'Add to build'}
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
                    const count = build.serverCount + build.localDelta;
                    const opStatus = buildOpStatus[build.id] ?? 'idle';
                    const isLoading = opStatus === 'loading';
                    const isError = opStatus === 'error';
                    const isInThisBuild = count > 0;

                    if (!isMulti && build.confirmingReplace) {
                      return (
                        <li key={build.id} className={styles.buildItem}>
                          <div className={styles.buildRow}>
                            <span className={styles.buildName}>{build.name}</span>
                            <div className={styles.confirmWarning}>
                              <span>
                                Slot already occupied. Replace?
                              </span>
                            </div>
                          </div>
                          <div className={styles.dropdownConfirmActions}>
                            <button
                              className={styles.dropdownConfirmBtn}
                              onClick={() => addToExistingBuild(build.id)}
                              disabled={isLoading}
                            >
                              Replace
                            </button>
                            <button
                              className={styles.dropdownCancelBtn}
                              onClick={() => cancelReplaceForBuild(build.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={build.id} className={styles.buildItem}>
                        <div className={`${styles.buildRow} ${isError ? styles.buildRowError : ''}`}>
                          <span className={styles.buildName}>{build.name}</span>

                          <div className={styles.buildStepper}>
                            {isLoading ? (
                              <Loader2 size={13} className={styles.spinnerIcon} />
                            ) : isError ? (
                              <span className={styles.errorText}>Error</span>
                            ) : isMulti ? (
                              count > 0 ? (
                                <>
                                  <button
                                    className={styles.buildStepBtn}
                                    onClick={() => removeFromExistingBuild(build.id)}
                                    aria-label={`Remove one from ${build.name}`}
                                    disabled={isLoading}
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <span className={styles.buildCount}>{count}</span>
                                  <button
                                    className={styles.buildStepBtn}
                                    onClick={() => addToExistingBuild(build.id)}
                                    aria-label={`Add one more to ${build.name}`}
                                    disabled={isLoading}
                                  >
                                    <Plus size={11} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  className={styles.buildAddBtn}
                                  onClick={() => addToExistingBuild(build.id)}
                                  aria-label={`Add to ${build.name}`}
                                  disabled={isLoading}
                                >
                                  <Plus size={12} />
                                </button>
                              )
                            ) : (
                              isInThisBuild ? (
                                <button
                                  className={`${styles.buildAddBtn} ${styles.inBuildBtn}`}
                                  onClick={() => removeFromExistingBuild(build.id)}
                                  aria-label={`Remove from ${build.name}`}
                                  disabled={isLoading}
                                >
                                  <Check size={12} />
                                </button>
                              ) : (
                                <button
                                  className={styles.buildAddBtn}
                                  onClick={() =>
                                    build.slotOccupiedBy
                                      ? requestReplaceForBuild(build.id)
                                      : addToExistingBuild(build.id)
                                  }
                                  aria-label={`Add to ${build.name}`}
                                  disabled={isLoading}
                                >
                                  <Plus size={12} />
                                </button>
                              )
                            )}
                          </div>
                        </div>
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