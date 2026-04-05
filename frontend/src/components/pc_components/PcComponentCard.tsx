import type { PcComponent } from "../../types/PcComponents.types";
import styles from '../../styles/PcComponentsScreen.module.css';

export function PcComponentCard({
  component,
  subtitle,
  onClick,
}: {
  component: PcComponent;
  subtitle: React.ReactNode;
  onClick: () => void;
}) {

  const availableLogos = import.meta.glob('../../assets/logos/*.svg', { eager: true });

  const manufacturerName = component.manufacturer ? component.manufacturer.toLowerCase() : '';
  const route = `../../assets/logos/${manufacturerName}.svg`;

  const logoExists = !!availableLogos[route];

  const logo = logoExists
    ? new URL(route, import.meta.url).href
    : undefined; 

  return (
    <button className={styles.card} onClick={onClick} type="button">
      <div className={styles.cardImage}>
        {logoExists ? (
          <img className={styles.cardLogo} src={logo} alt={component.manufacturer ?? ''}/>
        ) : (
          <div> TODO Design placeholder</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardName}>
          {component.name 
            ? (component.name.length > 80 
                ? `${component.name.substring(0, 80)}...` 
                : component.name)
            : '—'}
        </p>        
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        <p className={styles.cardMeta}>
          <span className={styles.cardMetaLabel}>Manufacturer:</span>{' '}
          {component.manufacturer ?? '—'}
        </p>
      </div>
    </button>
  );
}