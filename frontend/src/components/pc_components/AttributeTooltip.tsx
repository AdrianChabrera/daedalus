import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import styles from '../../styles/AttributeTooltip.module.css';

interface AttributeTooltipProps {
  description: string;
}

export function AttributeTooltip({ description }: AttributeTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !iconRef.current || !tooltipRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const spaceAbove = iconRect.top;
    const spaceBelow = window.innerHeight - iconRect.bottom;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosition(spaceAbove >= tooltipHeight + 8 || spaceAbove > spaceBelow ? 'top' : 'bottom');
  }, [visible]);

  return (
    <span className={styles.wrapper}>
      <span
        ref={iconRef}
        className={`${styles.icon} ${visible ? styles.iconActive : ''}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-label="More information"
      >
        <HelpCircle size={14} />
      </span>

      {visible && (
        <div
          ref={tooltipRef}
          className={`${styles.tooltip} ${position === 'bottom' ? styles.tooltipBottom : styles.tooltipTop}`}
          role="tooltip"
        >
          <div className={styles.arrow} />
          {description}
        </div>
      )}
    </span>
  );
}