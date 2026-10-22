import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { formatDateTime, formatMonth, statusLabel } from '../lib/format.js';
import {
  Avatar,
  BarChart,
  DashboardSkeleton,
  DataPanel,
  ProgressBar,
  StatCard,
} from '../components/ui.jsx';
import { BookIcon, ClipboardIcon, TrendIcon, UsersIcon } from '../components/icons.jsx';

const ACTION_LABELS = {
  'student.updated': 'Student updated',
  'student.created': 'Student added',
  'course.created': 'Course created',
  'course.updated': 'Course updated',
  'course.published': 'Course published',
  'course.unpublished': 'Course unpublished',
  'course.deleted': 'Course unpublished',
  'enrollment.created': 'Enrollment added',
  'enrollment.updated': 'Enrollment updated',
  'enrollment.deleted': 'Enrollment withdrawn',
  'admin.created': 'Administrator added',
  'admin.updated': 'Administrator updated',
  'profile.updated': 'Profile updated',
};

export function DashboardPage() {
  const { user } = useAuth();
  const resource = useResource(() => api('/api/v1/dashboard'), []);
  const data = resource.data?.data;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <DataPanel
      status={resource.status}
      error={resource.error}
      onRetry={resource.reload}
      skeleton={<DashboardSkeleton />}
    >
      {data ? (
        <div className="space-y-6">
          <section className="surface-card overflow-hidden">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Overview</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Good day, {firstName}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {data.publishedCourses} published and {data.draftCourses} draft courses are in the catalog.
                  Review progress, enrollments, and recent activity below.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/students" className="btn-secondary">Students</Link>
                <Link to="/courses" className="btn-primary">Review courses</Link>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={data.students} detail="Accounts on record" icon={UsersIcon} tone="accent" />
            <StatCard label="Courses" value={data.courses} detail="Published and draft" icon={BookIcon} tone="sky" />
            <StatCard label="Enrollments" value={data.enrollments} detail="Excluding withdrawn" icon={ClipboardIcon} tone="amber" />
            <StatCard label="Avg. progress" value={`${data.averageProgress}%`} detail="Active enrollments" icon={TrendIcon} tone="slate" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="surface-card min-w-0">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-ink">Needs attention</h2>
                  <p className="mt-1 text-sm text-ink-muted">Active enrollments under 40% progress.</p>
                </div>
                <Link to="/progress" className="text-sm font-semibold text-accent hover:text-accent-hover">View all</Link>
              </div>
              {data.attention.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-ink-muted">
                        <th className="px-5 py-3 font-semibold sm:px-6">Student</th>
                        <th className="px-5 py-3 font-semibold sm:px-6">Course</th>
                        <th className="px-5 py-3 font-semibold sm:px-6">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attention.map((row) => (
                        <tr key={`${row.studentName}-${row.courseTitle}`} className="border-t border-line hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="flex items-center gap-3 font-semibold text-ink">
                              <Avatar name={row.studentName} size="sm" />
                              {row.studentName}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-ink-muted sm:px-6">{row.courseTitle}</td>
                          <td className="px-5 py-3.5 sm:px-6"><ProgressBar value={row.percent} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-10 text-sm text-ink-muted sm:px-6">No active enrollments are below 40% right now.</p>
              )}
            </section>

            <aside className="space-y-5">
              <section className="surface-card p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-ink">Enrollment trend</h2>
                <p className="mb-4 mt-1 text-xs text-ink-muted">Last six months, withdrawn excluded.</p>
                <BarChart
                  emptyMessage="No enrollments in this period yet."
                  points={data.enrollmentTrend.map((point) => ({
                    ...point,
                    label: formatMonth(point.month),
                  }))}
                />
              </section>

              <section className="surface-card p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
                  <Link to="/reports" className="text-xs font-semibold text-accent hover:text-accent-hover">Reports</Link>
                </div>
                {data.recentActivity.length ? (
                  <ul className="divide-y divide-line">
                    {data.recentActivity.slice(0, 5).map((item) => (
                      <li key={item.id} className="py-3 text-sm first:pt-0 last:pb-0">
                        <p className="font-semibold text-ink">{ACTION_LABELS[item.action] || statusLabel(item.action)}</p>
                        <p className="mt-0.5 text-ink-muted">{item.actorName || 'System'} · {formatDateTime(item.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">No administrative activity recorded yet.</p>
                )}
              </section>
            </aside>
          </div>
        </div>
      ) : null}
    </DataPanel>
  );
}
