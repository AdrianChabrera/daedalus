import { useEffect, useState } from "react";
import styles from '../../styles/HomeScreen.module.css';

export function Counter({ target }: { target: number | null }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target == null) return;
    const dur = 900;
    const steps = 40;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setVal(Math.round(cur));
      if (cur >= target) clearInterval(id);
    }, dur / steps);
    return () => clearInterval(id);
  }, [target]);

  if (target == null) return <span className={styles.statValuePulse} />;
  return <>{val.toLocaleString()}</>;
}