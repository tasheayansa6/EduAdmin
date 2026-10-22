import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { ChevronDownIcon, ClockIcon, PlayIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { Meter, StudentData, StudentEmpty, formatMinutes } from '../student/components.jsx';
import { VideoPlayer } from '../student/VideoPlayer.jsx';

const TABS = [
  { key: 'content', label: 'Course content' },
  { key: 'overview', label: 'Overview' },
];

function LessonBody({ lesson }) {
  if (lesson.videoUrl) {
    return (
      <div className="aspect-video w-full bg-black">
        <VideoPlayer url={lesson.videoUrl} title={lesson.title} />
      </div>
    );
  }
  if (lesson.pdfUrl) {
    return (
      <div className="bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-6">
          <div>
            <p className="eyebrow">PDF</p>
            <h2 className="text-lg font-bold text-charcoal">{lesson.title}</h2>
          </div>
          <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="btn-outline py-2 text-sm">
            Open PDF
          </a>
        </div>
        <iframe title={lesson.title} src={lesson.pdfUrl} className="h-[70vh] w-full bg-sand" />
      </div>
    );
  }
  return (
    <div className="bg-white px-6 py-8 sm:px-10">
      <p className="eyebrow">Reading</p>
      <h2 className="mt-1 text-2xl font-bold text-charcoal">{lesson.title}</h2>
      {lesson.content ? (
        <div className="mt-5 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-charcoal">{lesson.content}</div>
      ) : (
        <p className="mt-5 text-sm text-charcoal-muted">This lesson has no material yet.</p>
      )}
    </div>
  );
}

function LessonCheckbox({ lesson, busy, onToggle }) {
  return (
    <input
      type="checkbox"
      className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-charcoal/40 accent-brand disabled:cursor-wait"
      checked={lesson.completed}
      disabled={busy}
      aria-label={`${lesson.completed ? 'Mark not done' : 'Mark done'}: ${lesson.title}`}
      onChange={() => onToggle(lesson)}
    />
  );
}

function lessonKind(lesson) {
  if (lesson.videoUrl) return { icon: <PlayIcon />, label: formatMinutes(lesson.durationMinutes) || 'Video' };
  if (lesson.pdfUrl) return { icon: <ClockIcon />, label: formatMinutes(lesson.durationMinutes) || 'PDF' };
  return { icon: <ClockIcon />, label: formatMinutes(lesson.durationMinutes) || 'Reading' };
}

function CourseContent({ sections, currentId, busyId, onSelect, onToggle }) {
  const [closed, setClosed] = useState(() => new Set());
  let number = 0;

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      {sections.map((section, sectionIndex) => {
        const done = section.lessons.filter((lesson) => lesson.completed).length;
        const minutes = formatMinutes(section.lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0));
        const sectionKey = section.id ?? `section-${sectionIndex}`;
        const open = !closed.has(sectionKey);
        const firstNumber = number;
        number += section.lessons.length;
        return (
          <section key={sectionKey} className="border-b border-hairline last:border-b-0">
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 bg-sand/70 px-5 py-3.5 text-left hover:bg-sand"
                aria-expanded={open}
                onClick={() => setClosed((current) => {
                  const next = new Set(current);
                  if (next.has(sectionKey)) next.delete(sectionKey);
                  else next.add(sectionKey);
                  return next;
                })}
              >
                <span>
                  <span className="block font-bold text-charcoal">Section {sectionIndex + 1}: {section.title}</span>
                  <span className="mt-0.5 block text-xs text-charcoal-muted">
                    {done} / {section.lessons.length}{minutes ? ` | ${minutes}` : ''}
                  </span>
                </span>
                <span className={`text-charcoal-muted transition-transform [&_svg]:h-4 [&_svg]:w-4 ${open ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
              </button>
            </h3>
            {open ? (
              <ul>
                {section.lessons.map((lesson, index) => {
                  const current = lesson.id === currentId;
                  const kind = lessonKind(lesson);
                  return (
                    <li key={lesson.id} className={`flex items-start gap-3 px-5 py-3 ${current ? 'bg-brand-soft' : 'hover:bg-canvas'}`}>
                      <LessonCheckbox lesson={lesson} busy={busyId === lesson.id} onToggle={onToggle} />
                      <button type="button" className="min-w-0 flex-1 text-left" aria-current={current ? 'step' : undefined} onClick={() => onSelect(lesson)}>
                        <span className={`block text-sm ${current ? 'font-bold text-brand' : 'text-charcoal'}`}>
                          {firstNumber + index + 1}. {lesson.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-charcoal-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
                          {kind.icon}
                          {kind.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function Overview({ course }) {
  const facts = [
    ['Lessons', course.progress?.totalLessons],
    ['Completed', course.progress?.completedLessons],
  ].filter(([, value]) => value != null);

  return (
    <div className="space-y-6">
      {facts.length ? (
        <dl className="grid gap-4 rounded-xl border border-hairline bg-white p-5 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-muted">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-charcoal">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="text-sm text-charcoal-muted">
        Open each lesson to watch the video, read the PDF, or complete the reading. Tick lessons as you finish them.
      </p>
    </div>
  );
}

function PlayerBody({ initial }) {
  const { afterEnrollment } = useStore();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [course, setCourse] = useState(initial);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('content');
  useDocumentTitle(course.title);

  const lessons = useMemo(() => course.sections.flatMap((section) => section.lessons), [course]);
  const requested = Number(params.get('lesson'));
  const current = lessons.find((lesson) => lesson.id === requested)
    ?? lessons.find((lesson) => !lesson.completed)
    ?? lessons[0];
  const position = lessons.indexOf(current);
  const next = lessons[position + 1];
  const previous = lessons[position - 1];

  const select = useCallback((lesson) => {
    setParams({ lesson: String(lesson.id) }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setParams]);

  async function toggle(lesson, completed = !lesson.completed) {
    setBusyId(lesson.id);
    try {
      const result = await api(`/api/v1/student/learn/local/${course.courseId}/lessons/${lesson.id}`, {
        method: 'PUT',
        body: { completed },
      });
      setCourse((value) => ({
        ...value,
        enrollmentStatus: result.data.enrollmentStatus,
        progress: result.data.progress,
        sections: value.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((item) => (item.id === lesson.id ? { ...item, completed } : item)),
        })),
      }));
      if (result.data.progress.percent === 100 && completed) toast.success('Course complete. Well done!');
      afterEnrollment();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function completeAndNext() {
    if (!current.completed && !(await toggle(current, true))) return;
    if (next) select(next);
  }

  if (!current) {
    return (
      <StudentEmpty
        title="No lessons yet"
        message="The instructor has not added lessons to this course yet."
        action={<Link to={`/learn/my-courses/${course.courseId}`} className="btn-brand">Back to course</Link>}
      />
    );
  }

  const { progress } = course;

  return (
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-8 lg:-mt-10">
      <div className="flex flex-col gap-3 bg-brand px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Link to={`/learn/my-courses/${course.courseId}`} className="text-xs font-semibold text-white/75 hover:text-white hover:underline">← Course page</Link>
          <h1 className="truncate text-lg font-bold sm:text-xl">{course.title}</h1>
        </div>
        <div className="w-full shrink-0 sm:w-64">
          <p className="mb-1.5 flex justify-between text-xs font-semibold text-white/85">
            <span>{progress.completedLessons} of {progress.totalLessons} lessons done</span>
            <span>{progress.percent}%</span>
          </p>
          <div className="[&_[role=progressbar]]:bg-white/20 [&_[role=progressbar]>div]:bg-wheat">
            <Meter value={progress.percent} label="Course progress" />
          </div>
        </div>
      </div>

      <div className="bg-charcoal">
        <div className="mx-auto max-w-5xl">
          <LessonBody lesson={current} />
        </div>
      </div>

      <div className="border-b border-hairline bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="min-w-0 truncate text-sm">
            <span className="text-charcoal-muted">Lesson {position + 1} of {lessons.length}:</span>{' '}
            <span className="font-semibold">{current.title}</span>
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-outline py-2" disabled={!previous} onClick={() => select(previous)}>Previous</button>
            {current.completed && !next ? (
              <button type="button" className="btn-outline py-2" disabled={busyId === current.id} onClick={() => toggle(current, false)}>Mark not done</button>
            ) : (
              <button type="button" className="btn-brand py-2" disabled={busyId === current.id} onClick={completeAndNext}>
                {current.completed ? 'Next lesson' : next ? 'Mark done & next' : 'Mark done'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
        <div role="tablist" aria-label="Course sections" className="flex gap-6 overflow-x-auto border-b border-hairline">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`tab-${item.key}`}
              aria-selected={tab === item.key}
              aria-controls={`panel-${item.key}`}
              className={`-mb-px whitespace-nowrap border-b-2 py-3.5 text-sm font-bold transition-colors ${tab === item.key ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal-muted hover:text-charcoal'}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
          {tab === 'content' ? (
            <CourseContent sections={course.sections} currentId={current.id} busyId={busyId} onSelect={select} onToggle={(lesson) => toggle(lesson)} />
          ) : (
            <Overview course={course} />
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentLocalPlayerPage() {
  const { courseId } = useParams();
  const [resource, setResource] = useState({ status: 'loading', data: null, error: null });

  const load = useCallback(async () => {
    setResource({ status: 'loading', data: null, error: null });
    try {
      const result = await api(`/api/v1/student/learn/local/${encodeURIComponent(courseId)}`);
      setResource({ status: 'ready', data: result.data, error: null });
    } catch (error) {
      setResource({ status: 'error', data: null, error });
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (resource.error?.status === 403) {
    return (
      <StudentEmpty
        title="Enroll to start learning"
        message="The lessons open once you are enrolled in this course."
        action={<Link to={`/learn/my-courses/${courseId}`} className="btn-brand">See the course</Link>}
      />
    );
  }

  return (
    <StudentData resource={{ ...resource, reload: load }} label="Loading lessons" errorTitle="The lessons could not be loaded">
      {(data) => <PlayerBody key={data.courseId} initial={data} />}
    </StudentData>
  );
}
