import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import styles from '../../styles/CompatibilityPanel.module.css';
import type { Props } from '../../types/CreateBuildTypes';
import { SEVERITY_META, SEVERITY_ORDER } from '../../consts/CreateBuildConsts';

export function CompatibilityPanel({ issues, loading, error }: Props) {
  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  const errorCount       = issues.filter(i => i.severity === 'error').length;
  const warningCount     = issues.filter(i => i.severity === 'warning').length;
  const unverifiableCount = issues.filter(i => i.severity === 'unverifiable').length;

  const headerState: 'ok' | 'error' | 'warning' | 'unverifiable' | 'loading' =
    loading
      ? 'loading'
      : errorCount > 0
      ? 'error'
      : warningCount > 0
      ? 'warning'
      : unverifiableCount > 0
      ? 'unverifiable'
      : 'ok';

  return (
    <div className={`${styles.panel} ${styles[`panel_${headerState}`]}`}>
      <div className={`${styles.header} ${styles[`header_${headerState}`]}`}>
        <span className={styles.headerTitle}>Compatibility</span>

        {!loading && issues.length > 0 && (
          <div className={styles.headerBadges}>
            {errorCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeError}`}>
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeWarning}`}>
                {warningCount} warning{warningCount > 1 ? 's' : ''}
              </span>
            )}
            {unverifiableCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeUnverifiable}`}>
                {unverifiableCount} unverifiable
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.loadingRow}>
            <Loader2 size={14} className={styles.spinner} />
            <span>Checking compatibility…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.fetchError}>
            <AlertTriangle size={13} />
            <span>Could not run compatibility check.</span>
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <div className={styles.allClear}>
            <CheckCircle size={14} className={styles.allClearIcon} />
            <span>No issues detected.</span>
          </div>
        )}

        {!loading && !error && sorted.map((issue, i) => {
          const meta = SEVERITY_META[issue.severity];
          const Icon = meta.icon;

          return (
            <div key={`${issue.rule}-${i}`} className={`${styles.issueRow} ${styles[meta.rowClass]}`}>
              <div className={styles.issueHeader}>
                <Icon size={13} className={`${styles.issueIcon} ${styles[meta.iconClass]}`} />
                <span className={`${styles.issueBadge} ${styles[meta.badgeClass]}`}>
                  {meta.label}
                </span>
              </div>

              <p className={styles.issueMessage}>{issue.message}</p>

              {issue.components.length > 0 && (
                <div className={styles.issueComponents}>
                  {issue.components.map((c, ci) => (
                    <span key={ci} className={styles.issueComponent}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}