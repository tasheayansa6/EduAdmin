import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SEARCH_DEBOUNCE_MS = 280;

export function useListParams() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') || 1);
  const [draft, setDraft] = useState(q);
  const skipDebounce = useRef(false);

  useEffect(() => {
    skipDebounce.current = true;
    setDraft(q);
  }, [q]);

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return undefined;
    }
    const trimmed = draft.trim();
    if (trimmed === q) return undefined;

    const timer = window.setTimeout(() => {
      setParams((prev) => {
        const updated = new URLSearchParams(prev);
        updated.delete('page');
        if (trimmed) updated.set('q', trimmed);
        else updated.delete('q');
        return updated;
      }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, q, setParams]);

  function update(next, { resetPage = true } = {}) {
    setParams((prev) => {
      const updated = new URLSearchParams(prev);
      if (resetPage) updated.delete('page');
      Object.entries(next).forEach(([key, value]) => {
        if (value) updated.set(key, String(value));
        else updated.delete(key);
      });
      return updated;
    }, { replace: true });
  }

  return {
    q,
    page,
    draft,
    setDraft,
    update,
    status: params.get('status') ?? '',
    courseId: params.get('courseId') ?? '',
    categoryId: params.get('categoryId') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  };
}
