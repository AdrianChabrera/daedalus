import { useCallback, useEffect, useState } from "react";
import { API_ROUTES } from "../config/api";
import type { RatingStats } from "../types/Reviews.type";

export function useComponentRatingStats(type?: string, id?: string) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!type || !id) return;
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COMPONENT_RATING_STATS(type, id));
      if (!res.ok) return;
      const data: RatingStats = await res.json();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}