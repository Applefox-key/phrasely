import { useMemo } from 'react';
import { useDemoStore } from './demoStore';
import type { ExpressionFilters } from '../api/expressions';

/** Returns filtered demo expressions — same interface as useQuery for expressions */
export function useDemoExpressions(filters?: ExpressionFilters) {
  const expressions = useDemoStore((s) => s.expressions);

  const data = useMemo(() => {
    if (!filters) return expressions;
    return expressions.filter((e) => {
      if (filters.labelid && String(e.labelid) !== String(filters.labelid)) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.stage !== undefined && filters.stage !== '' && String(e.stage) !== String(filters.stage)) return false;
      if (filters.inQueue && !e.inQueue) return false;
      if (filters.filter) {
        const q = (filters.filter as string).toLowerCase();
        if (
          !e.phrase.toLowerCase().includes(q) &&
          !e.expression.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [expressions, filters]);

  return { data, isLoading: false };
}

/** Returns expressions due for training today */
export function useDemoUnread() {
  const getUnread = useDemoStore((s) => s.getUnread);
  // Subscribe to expressions so the hook re-runs when data changes
  useDemoStore((s) => s.expressions);
  return { data: getUnread(), isLoading: false };
}

/** Returns demo labels */
export function useDemoLabels() {
  const labels = useDemoStore((s) => s.labels);
  return { data: labels, isLoading: false };
}
