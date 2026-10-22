import { Link } from 'react-router-dom';
import { CheckIcon, FlameIcon, TrendIcon } from '../components/icons.jsx';
import { currentEnrollments, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import { Meter, StudentData, StudentEmpty, enrollmentLink } from '../student/components.jsx';

function StatTile({ label, value, detail }) {
  return (
    <div className="hub-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-charcoal">{value}</p>
      {detail ? <p className="mt-1 text-sm text-charcoal-muted">{detail}</p> : null}
    </div>
  );
}

function ModuleRow({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  return (
    <li className="hub-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-charcoal">
            <Link to={enrollmentLink(enrollment)} className="hover:text-brand">{enrollment.courseTitle}</Link>
          </h3>
          <p className="mt-0.5 text-sm text-charcoal-muted">
            {[enrollment.categoryName, enrollment.instructorName].filter(Boolean).join(' · ') || 'Course'}
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{percent}%</span>
      </div>
      <div className="mt-3">
        <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-charcoal-muted">
          {percent >= 100 ? 'All lessons complete' : percent > 0 ? 'Keep going — open the next lesson' : 'Not started yet'}
        </span>
        <Link to={enrollmentLink(enrollment)} className="font-semibold text-brand hover:underline">
          Open player
        </Link>
      </div>
    </li>
  );
}

function ProgressBody({ data }) {
  const rows = currentEnrollments(data);
  const active = rows.filter((row) => row.status === 'active').sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const completed = rows.filter((row) => row.status === 'completed');
  const avg = data.summary?.averageProgress;
  const enrolled = rows.length;
  const pace = avg == null ? null : avg >= 70 ? 'On track' : avg >= 40 ? 'Building momentum' : 'Needs attention';

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-muted">My progress</p>
          <h1 className="display-title mt-1 text-3xl font-bold sm:text-4xl">Learning progress</h1>
        </div>
        {active.length ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand [&_svg]:h-4 [&_svg]:w-4">
            <FlameIcon />
            {active.length} active module{active.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </header>

      {!enrolled ? (
        <StudentEmpty
          title="No progress yet"
          message="Enroll in a course to track lesson completion and average progress here."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Enrolled" value={enrolled} detail={`${active.length} in progress`} />
            <StatTile label="Completed" value={completed.length} detail={completed.length ? 'Milestones earned' : 'Finish a course to unlock'} />
            <StatTile
              label="Average pace"
              value={avg == null ? '—' : `${avg}%`}
              detail={(
                <span className="inline-flex items-center gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {pace}
                  {avg != null && avg >= 40 ? <TrendIcon /> : null}
                </span>
              )}
            />
          </div>

          <section aria-labelledby="modules-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="modules-title" className="font-display text-xl font-bold text-charcoal">Active modules</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">{active.length} enrolled</p>
            </div>
            {active.length ? (
              <ul className="space-y-3">
                {active.map((row) => <ModuleRow key={row.id} enrollment={row} />)}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-hairline bg-white px-4 py-8 text-center text-sm text-charcoal-muted">
                No active courses. Your completed ones are listed below.
              </p>
            )}
          </section>

          <section aria-labelledby="milestones-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="milestones-title" className="font-display text-xl font-bold text-charcoal">Milestones</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">{completed.length} verified</p>
            </div>
            {completed.length ? (
              <ul className="space-y-2">
                {completed.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-4 [&_svg]:w-4">
                      <CheckIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-charcoal">{row.courseTitle}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Completed</p>
                    </div>
                    <Link to={enrollmentLink(row)} className="text-sm font-semibold text-brand hover:underline">Review</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-charcoal-muted">Complete every lesson in a course to earn a milestone here.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function StudentProgressPage() {
  useDocumentTitle('Progress');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your progress">
      {(data) => <ProgressBody data={data} />}
    </StudentData>
  );
}
