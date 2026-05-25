import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 910;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => screen.width < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handler = () => setIsMobile(screen.width < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}