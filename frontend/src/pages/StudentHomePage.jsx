import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { formatDate } from '../lib/format.js';
import { BarChart, DataPanel, ProgressBar, StatusBadge } from '../components/ui.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function HomeSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true">
      <span className="sr-only">Loading your courses</span>
      <div className="space-y-5">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function StudentHomePage() {
  const toast = useToast();
  const resource = useResource(() => api('/api/v1/student/home'), []);
  const [pendingId, setPendingId] = useState(null);
  const data = resource.data?.data;
  const firstName = data?.profile?.name?.trim().split(/\s+/)[0] || 'there';
  const current = (data?.enrollments || []).filter((row) => row.status !== 'withdrawn');
  const inProgress = current.filter((row) => row.progressStatus === 'in_progress');
  const openCourses = (data?.catalog || []).filter((course) => !course.enrollmentStatus || course.enrollmentStatus === 'withdrawn').slice(0, 4);

  async function enroll(courseId) {
    setPendingId(courseId);
    try {
      await api('/api/v1/student/enrollments', { method: 'POST', body: { courseId } });
      toast.success('Enrollment saved in the database.');
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DataPanel status={resource.status} error={resource.error} onRetry={resource.reload} skeleton={<HomeSkeleton />}>
      {data ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-xl border border-ink bg-ink text-white shadow-card">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Learning record</p>
                  <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-snug tracking-tight">
                    {greeting()}, {firstName}. Here are the courses on your account.
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-slate-300">
                    {current.length} current enrollment{current.length === 1 ? '' : 's'}. Choose a published course to enroll.
                  </p>
                </div>
                <Link to="/learn/courses" className="inline-flex shrink-0 items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-100">
                  Browse courses
                </Link>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="surface-card border-l-4 border-l-accent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Enrolled</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{current.length}</p>
                <p className="mt-1 text-sm text-ink-muted">Active and completed</p>
              </article>
              <article className="surface-card border-l-4 border-l-accent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Completed</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{data.summary.completed}</p>
                <p className="mt-1 text-sm text-ink-muted">Marked completed</p>
              </article>
              <article className="surface-card border-l-4 border-l-accent p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">In progress</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{inProgress.length}</p>
                <p className="mt-1 text-sm text-ink-muted">Marked in progress</p>
              </article>
            </div>

            <section className="surface-card">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Your enrollments</h2>
                  <p className="mt-1 text-sm text-ink-muted">Rows stored for this account in the enrollments table.</p>
                </div>
                <Link to="/learn/courses" className="text-sm font-semibold text-accent hover:text-accent-hover">Catalog</Link>
              </div>
              {data.enrollments.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-ink-muted">
                        <th className="px-5 py-3 font-semibold">Course</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Progress</th>
                        <th className="px-5 py-3 font-semibold">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.enrollments.map((row) => (
                        <tr key={row.id} className="border-t border-line">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-ink">{row.courseTitle}</p>
                            <p className="text-ink-muted">{row.categoryName}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="flex flex-wrap gap-2">
                              <StatusBadge status={row.status} />
                              {row.progressStatus ? <StatusBadge status={row.progressStatus} /> : null}
                            </span>
                          </td>
                          <td className="px-5 py-3">{row.percent == null ? <span className="text-ink-muted">No progress data</span> : <ProgressBar value={row.percent} />}</td>
                          <td className="px-5 py-3 text-ink-muted">{formatDate(row.enrolledAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-ink-muted">This account has no enrollment rows yet. Enroll in a published course to create one.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Average progress</p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
                  style={{ background: `conic-gradient(#0f766e ${(data.summary.averageProgress ?? 0) * 3.6}deg, #e2e8f0 0deg)` }}
                  role="img"
                  aria-label={data.summary.averageProgress == null ? 'No average progress yet' : `Average progress ${data.summary.averageProgress} percent`}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold tabular-nums">
                    {data.summary.averageProgress == null ? '—' : `${data.summary.averageProgress}%`}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Mean of the progress percents stored on your current enrollments.
                </p>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Course progress</h2>
              <p className="mb-4 mt-1 text-xs text-ink-muted">Stored percent for each current enrollment.</p>
              <BarChart
                emptyMessage="No stored progress yet."
                hideWhenZero={false}
                points={current.slice(0, 6).map((row) => ({
                  month: String(row.id),
                  label: row.courseTitle,
                  count: row.percent ?? 0,
                }))}
              />
            </section>

            <section className="surface-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Enroll</h2>
                <Link to="/learn/courses" className="text-xs font-semibold text-accent hover:text-accent-hover">All courses</Link>
              </div>
              <p className="mb-3 text-xs text-ink-muted">Choosing a course inserts an enrollment for this student.</p>
              {openCourses.length ? (
                <ul className="divide-y divide-line">
                  {openCourses.map((course) => (
                    <li key={course.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{course.title}</p>
                        <p className="text-xs text-ink-muted">{course.categoryName}</p>
                      </div>
                      <button type="button" className="btn-primary shrink-0" disabled={pendingId === course.id} onClick={() => enroll(course.id)}>
                        {pendingId === course.id ? 'Saving…' : 'Enroll'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">Every published course is already on this account.</p>
              )}
            </section>
          </aside>
        </div>
      ) : null}
    </DataPanel>
  );
}
