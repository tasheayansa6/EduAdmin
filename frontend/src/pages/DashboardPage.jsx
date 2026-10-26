import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { formatDateTime, roleLabel, statusLabel } from '../lib/format.js';
import {
  Avatar,
  DashboardSkeleton,
  DataPanel,
  ProgressBar,
} from '../components/ui.jsx';
import { BookIcon, ClipboardIcon, TrendIcon, UsersIcon } from '../components/icons.jsx';

const ACTION_LABELS = {
  'student.updated': 'Student updated',
  'student.created': 'Student added',
  'course.created': 'Course created',
  'course.updated': 'Course updated',
  'course.published': 'Course published',
  'course.unpublished': 'Course unpublished',
  'course.deleted': 'Course deleted',
  'student.deleted': 'Student deleted',
  'blog.created': 'Blog drafted',
  'blog.updated': 'Blog updated',
  'blog.published': 'Blog published',
  'blog.unpublished': 'Blog unpublished',
  'blog.deleted': 'Blog deleted',
  'contact.updated': 'Contact info updated',
  'contact.message_received': 'Contact message received',
  'contact.message_updated': 'Contact message updated',
  'contact.message_deleted': 'Contact message deleted',
  'career.application_received': 'Career application received',
  'subscription.campaign_sent': 'Subscription email sent',
  'subscription.unsubscribed': 'Subscriber unsubscribed',
  'subscription.reactivated': 'Subscriber reactivated',
  'subscription.deleted': 'Subscriber removed',
  'career.created': 'Career drafted',
  'career.published': 'Career opened',
  'career.closed': 'Career closed',
  'career.updated': 'Career updated',
  'career.deleted': 'Career deleted',
  'career.application_updated': 'Career application updated',
  'enrollment.created': 'Enrollment added',
  'enrollment.updated': 'Enrollment updated',
  'enrollment.deleted': 'Enrollment withdrawn',
  'admin.created': 'Administrator added',
  'admin.updated': 'Administrator updated',
  'profile.updated': 'Profile updated',
};

const TABS = [
  { key: 'students', label: 'Students', to: '/students' },
  { key: 'courses', label: 'Courses', to: '/courses' },
  { key: 'enrollment', label: 'Enrollment', to: '/enrollments' },
];

function MetricCard({ label, value, badge, badgeTone = 'good', children }) {
  const tones = {
    good: 'bg-emerald-50 text-emerald-800',
    warn: 'bg-amber-50 text-amber-900',
    muted: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
        {badge ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tones[badgeTone]}`}>{badge}</span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{value}</p>
      {children}
    </div>
  );
}

function RosterCard({ student }) {
  const review = student.needsReview;
  return (
    <li className="rounded-2xl border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink">{student.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${review ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
              {review ? 'Review required' : 'Active'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-ink-muted">#{student.id} · {student.email}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {student.courseCount} course{student.courseCount === 1 ? '' : 's'} enrolled
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          to={`/students?q=${encodeURIComponent(student.email || student.name)}`}
          className={`btn flex-1 py-2 text-sm ${review ? 'bg-red-700 text-white hover:bg-red-800' : 'btn-secondary'}`}
        >
          {review ? 'Resolve' : 'View'}
        </Link>
        <Link to={`/students?q=${encodeURIComponent(student.email || student.name)}`} className="btn-secondary flex-1 py-2 text-sm">Edit</Link>
      </div>
    </li>
  );
}

function AttentionCard({ row }) {
  return (
    <li className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={row.studentName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{row.studentName}</p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{row.courseTitle}</p>
          <div className="mt-2 max-w-xs">
            <ProgressBar value={row.percent} />
          </div>
        </div>
      </div>
      <Link to={`/students?q=${encodeURIComponent(row.studentName)}`} className="btn mt-3 w-full bg-amber-800 py-2 text-sm text-white hover:bg-amber-900">
        Resolve
      </Link>
    </li>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const resource = useResource(() => api('/api/v1/dashboard'), []);
  const data = resource.data?.data;
  const [tab, setTab] = useState('students');

  return (
    <DataPanel
      status={resource.status}
      error={resource.error}
      onRetry={resource.reload}
      skeleton={<DashboardSkeleton />}
    >
      {data ? (
        <div className="space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
                {roleLabel(user.role)}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Institutional management
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {data.publishedCourses} published · {data.draftCourses} draft · live roster and audit stream
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/courses" className="btn-primary">+ New course</Link>
              <Link to="/reports" className="btn-secondary">Export audit</Link>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total enrolled" value={data.enrollments.toLocaleString()} badge="Live" badgeTone="good">
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
                <UsersIcon /> {data.students.toLocaleString()} student accounts
              </p>
            </MetricCard>
            <MetricCard
              label="Active courses"
              value={data.publishedCourses.toLocaleString()}
              badge={data.draftCourses ? `${data.draftCourses} draft` : 'Published'}
              badgeTone={data.draftCourses ? 'warn' : 'muted'}
            >
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
                <BookIcon /> {data.courses} total courses
              </p>
            </MetricCard>
            <MetricCard label="Avg. completion" value={`${data.averageProgress}%`} badge={data.averageProgress >= 70 ? 'On track' : 'Watch'}>
              <div className="mt-3">
                <ProgressBar value={data.averageProgress} />
              </div>
            </MetricCard>
            <MetricCard
              label="Administrators"
              value={(data.activeAdmins || 0).toLocaleString()}
              badge="Active"
              badgeTone="good"
            >
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
                <TrendIcon /> {data.activeAdmins} active admin{data.activeAdmins === 1 ? '' : 's'}
              </p>
            </MetricCard>
          </div>

          <div role="tablist" aria-label="Management areas" className="flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
            {TABS.map((item) => {
              const count = item.key === 'students'
                ? data.students
                : item.key === 'courses'
                  ? data.courses
                  : data.enrollments;
              const selected = tab === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  role="tab"
                  aria-selected={selected}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${selected ? 'bg-accent text-white shadow-soft' : 'text-ink-muted hover:text-ink'}`}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                  <span className={`ml-1.5 tabular-nums ${selected ? 'text-white/80' : ''}`}>({count})</span>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <section className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">
                    {tab === 'students' ? 'Active roster' : tab === 'courses' ? 'Courses snapshot' : 'Needs attention'}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {tab === 'students' ? 'Newest student accounts' : tab === 'courses' ? 'Published vs draft split' : 'Active enrollments under 40%'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  Real-time
                </span>
              </div>

              {tab === 'students' ? (
                data.roster?.length ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {data.roster.map((student) => <RosterCard key={student.id} student={student} />)}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink-muted">
                    No students yet. <Link to="/students" className="font-semibold text-accent hover:underline">Add a student</Link>
                  </p>
                )
              ) : null}

              {tab === 'courses' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Published</p>
                    <p className="mt-2 font-display text-4xl font-bold text-accent">{data.publishedCourses}</p>
                    <Link to="/courses?status=published" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">Open courses</Link>
                  </div>
                  <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Draft</p>
                    <p className="mt-2 font-display text-4xl font-bold text-ink">{data.draftCourses}</p>
                    <Link to="/courses?status=draft" className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">Review drafts</Link>
                  </div>
                  <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:col-span-2">
                    <p className="text-sm text-ink-muted">Create a course with video or PDF lesson links, then publish it for students.</p>
                    <Link to="/courses" className="btn-primary mt-4">+ New course</Link>
                  </div>
                </div>
              ) : null}

              {tab === 'enrollment' ? (
                data.attention.length ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {data.attention.map((row) => (
                      <AttentionCard key={`${row.studentName}-${row.courseTitle}`} row={row} />
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink-muted">
                    No active enrollments are below 40% right now.
                  </p>
                )
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/students" className="btn-secondary text-sm">All students</Link>
                <Link to="/enrollments" className="btn-secondary text-sm">All enrollments</Link>
                <Link to="/progress" className="btn-secondary text-sm">Progress</Link>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-ink">Audit & stream</h3>
                  <Link to="/reports" className="text-sm font-semibold text-accent hover:text-accent-hover">View all</Link>
                </div>
                {data.recentActivity.length ? (
                  <ol className="relative space-y-0 border-l border-line pl-4">
                    {data.recentActivity.slice(0, 6).map((item) => (
                      <li key={item.id} className="relative pb-5 last:pb-0">
                        <span className="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-white" aria-hidden="true" />
                        <p className="text-sm font-semibold text-ink">{ACTION_LABELS[item.action] || statusLabel(item.action)}</p>
                        {item.details ? <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{item.details}</p> : null}
                        <p className="mt-1 text-xs text-ink-muted">
                          {item.actorName || 'System'} · {formatDateTime(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-ink-muted">No administrative activity recorded yet.</p>
                )}
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
                <h3 className="font-display text-lg font-bold text-ink">Quick links</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link to="/students" className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-slate-50 [&_svg]:h-4 [&_svg]:w-4">
                      <UsersIcon /> Manage students
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-slate-50 [&_svg]:h-4 [&_svg]:w-4">
                      <BookIcon /> Courses & lessons
                    </Link>
                  </li>
                  <li>
                    <Link to="/enrollments" className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-slate-50 [&_svg]:h-4 [&_svg]:w-4">
                      <ClipboardIcon /> Enrollments
                    </Link>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      ) : null}
    </DataPanel>
  );
}
