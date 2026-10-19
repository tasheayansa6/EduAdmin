import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useListParams() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') || 1);
  const [draft, setDraft] = useState(q);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  function update(next, { resetPage = true } = {}) {
    const updated = new URLSearchParams(params);
    if (resetPage) updated.delete('page');
    Object.entries(next).forEach(([key, value]) => {
      if (value) updated.set(key, String(value));
      else updated.delete(key);
    });
    setParams(updated);
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
