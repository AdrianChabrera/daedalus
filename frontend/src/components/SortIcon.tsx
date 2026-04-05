import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import type { SortDirection } from '../types/PcComponents.types';

interface SortIconProps {
  direction: SortDirection;
}

export function SortIcon({ direction }: SortIconProps) {
  if (direction === 'ASC') return <ArrowUp size={13} />;
  if (direction === 'DESC') return <ArrowDown size={13} />;
  return <ArrowUpDown size={13} />;
}