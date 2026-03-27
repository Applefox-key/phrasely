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
  const expressions = useDemoStore((s) => s.expressions);
  const data = useMemo(() => {
    const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const cutoff = todayEnd.getTime() + tzOffsetMs;
    return expressions.filter(
      (e) =>
        e.status === 'active' &&
        (e.stage ?? 0) < 9 &&
        !e.inQueue &&
        new Date(e.nextDate).getTime() <= cutoff
    );
  }, [expressions]);
  return { data, isLoading: false };
}

/** Returns demo labels */
export function useDemoLabels() {
  const labels = useDemoStore((s) => s.labels);
  return { data: labels, isLoading: false };
}
