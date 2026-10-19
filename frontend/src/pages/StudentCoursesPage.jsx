import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { DataPanel, ProgressBar, StatusBadge } from '../components/ui.jsx';

export function StudentCoursesPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim().toLowerCase();
  const resource = useResource(() => api('/api/v1/student/home'), []);
  const [pendingId, setPendingId] = useState(null);
  const catalog = (resource.data?.data?.catalog ?? []).filter((course) => {
    if (!query) return true;
    return `${course.title} ${course.categoryName} ${course.description}`.toLowerCase().includes(query);
  });

  async function enroll(courseId) {
    setPendingId(courseId);
    try {
      await api('/api/v1/student/enrollments', { method: 'POST', body: { courseId } });
      toast.success('You are enrolled. The course is saved to your record.');
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DataPanel
      status={resource.status}
      error={resource.error}
      onRetry={resource.reload}
      skeleton={<div className="h-64 animate-pulse rounded-xl bg-slate-200" aria-busy="true"><span className="sr-only">Loading courses</span></div>}
    >
      <p className="mb-5 max-w-2xl text-sm text-ink-muted">
        Published courses from the database. Enroll to store the course on your account.
        {query ? ` Showing matches for “${params.get('q')}”.` : ''}
      </p>
      {catalog.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {catalog.map((course) => {
            const open = !course.enrollmentStatus || course.enrollmentStatus === 'withdrawn';
            return (
              <li key={course.id} className="surface-card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-ink">{course.title}</h2>
                  {course.enrollmentStatus ? (
                    <span className="flex shrink-0 flex-wrap justify-end gap-2">
                      <StatusBadge status={course.enrollmentStatus} />
                      {course.progressStatus ? <StatusBadge status={course.progressStatus} /> : null}
                    </span>
                  ) : <span className="text-xs font-semibold text-ink-muted">Not enrolled</span>}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{course.categoryName}</p>
                <p className="mt-3 text-sm text-ink-muted">{course.description}</p>
                <div className="mt-4">
                  {open ? (
                    <button type="button" className="btn-primary" disabled={pendingId === course.id} onClick={() => enroll(course.id)}>
                      {pendingId === course.id ? 'Saving…' : course.enrollmentStatus === 'withdrawn' ? 'Enroll again' : 'Enroll'}
                    </button>
                  ) : course.percent == null ? (
                    <p className="text-sm text-ink-muted">No progress row is stored for this enrollment.</p>
                  ) : (
                    <ProgressBar value={course.percent} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-white px-5 py-8 text-sm text-ink-muted">
          {query ? 'No published course matches that search.' : 'No published courses are in the catalog.'}
        </p>
      )}
    </DataPanel>
  );
}
