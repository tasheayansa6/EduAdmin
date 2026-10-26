import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ChevronDownIcon, ClockIcon, PlayIcon } from '../components/icons.jsx';
import { Meter, formatMinutes } from './components.jsx';
import { VideoPlayer } from './VideoPlayer.jsx';

export function LessonBody({ lesson }) {
  if (lesson.videoUrl) {
    return (
      <div className="relative min-h-0 flex-1 bg-black">
        <div className="absolute inset-0">
          <VideoPlayer url={lesson.videoUrl} title={lesson.title} />
        </div>
      </div>
    );
  }
  if (lesson.pdfUrl) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <div>
            <p className="eyebrow">PDF</p>
            <h2 className="text-lg font-bold text-charcoal">{lesson.title}</h2>
          </div>
          <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="btn-outline py-2 text-sm">
            Open PDF
          </a>
        </div>
        <iframe title={lesson.title} src={lesson.pdfUrl} className="min-h-0 w-full flex-1 bg-sand" />
      </div>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-8 sm:px-8">
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
  if (lesson.videoUrl || lesson.type === 'video') {
    return { label: 'Video', icon: <PlayIcon />, tone: 'text-brand' };
  }
  if (lesson.pdfUrl || lesson.type === 'pdf') {
    return { label: 'PDF', icon: <ClockIcon />, tone: 'text-wheat-ink' };
  }
  return { label: 'Reading', icon: <ClockIcon />, tone: 'text-charcoal-muted' };
}

/** Full outline: every video, PDF, and reading in the course. */
export function CourseContentPanel({ sections, currentId, busyId, onSelect, onToggle }) {
  const [closed, setClosed] = useState(() => new Set());
  let number = 0;
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const doneLessons = sections.reduce((sum, section) => sum + section.lessons.filter((l) => l.completed).length, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-none border-0 bg-white lg:rounded-none">
      <div className="border-b border-hairline bg-sand/80 px-4 py-3">
        <h2 className="text-base font-bold text-charcoal">Course content</h2>
        <p className="mt-0.5 text-xs text-charcoal-muted">
          {doneLessons} / {totalLessons} · videos, PDFs & readings
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
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
                  className="flex w-full items-center justify-between gap-3 bg-sand/50 px-4 py-3 text-left hover:bg-sand"
                  aria-expanded={open}
                  onClick={() => setClosed((current) => {
                    const next = new Set(current);
                    if (next.has(sectionKey)) next.delete(sectionKey);
                    else next.add(sectionKey);
                    return next;
                  })}
                >
                  <span>
                    <span className="block text-sm font-bold text-charcoal">Section {sectionIndex + 1}: {section.title}</span>
                    <span className="mt-0.5 block text-xs text-charcoal-muted">
                      {done}/{section.lessons.length}{minutes ? ` · ${minutes}` : ''}
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
                      <li key={lesson.id} className={`flex items-start gap-2.5 border-t border-hairline/70 px-4 py-2.5 ${current ? 'bg-brand-soft' : 'hover:bg-canvas'}`}>
                        <LessonCheckbox lesson={lesson} busy={busyId === lesson.id} onToggle={onToggle} />
                        <button type="button" className="min-w-0 flex-1 text-left" aria-current={current ? 'step' : undefined} onClick={() => onSelect(lesson)}>
                          <span className={`block text-sm ${current ? 'font-bold text-brand' : 'text-charcoal'}`}>
                            {firstNumber + index + 1}. {lesson.title}
                          </span>
                          <span className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${kind.tone} [&_svg]:h-3.5 [&_svg]:w-3.5`}>
                            {kind.icon}
                            {kind.label}
                            {lesson.durationMinutes ? <span className="font-normal text-charcoal-muted">· {formatMinutes(lesson.durationMinutes)}</span> : null}
                            {lesson.completed ? <span className="inline-flex items-center gap-0.5 font-normal text-brand [&_svg]:h-3 [&_svg]:w-3"><CheckIcon /> Done</span> : null}
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
    </div>
  );
}

export function CoursePlayerChrome({
  title,
  backTo,
  progress,
  current,
  position,
  total,
  previous,
  next,
  busyId,
  onSelect,
  onToggle,
  onCompleteAndNext,
  sections,
  overview = null,
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-charcoal">
      <div className="flex shrink-0 flex-col gap-2 bg-[#1c1d1f] px-4 py-2.5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <Link to={backTo} className="text-xs font-semibold text-white/70 hover:text-white hover:underline">← Course page</Link>
          <h1 className="truncate text-sm font-bold sm:text-base">{title}</h1>
        </div>
        <div className="w-full shrink-0 sm:max-w-xs sm:w-72">
          <p className="mb-1 flex justify-between text-[11px] font-semibold text-white/80">
            <span>{progress.completedLessons} of {progress.totalLessons} lessons done</span>
            <span>{progress.percent}%</span>
          </p>
          <div className="[&_[role=progressbar]]:bg-white/15 [&_[role=progressbar]>div]:bg-brand">
            <Meter value={progress.percent} label="Course progress" />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <div className="flex min-h-0 min-w-0 flex-col bg-black">
          <LessonBody lesson={current} />
          <div className="shrink-0 border-t border-white/10 bg-[#1c1d1f] px-4 py-3 text-white sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 truncate text-sm">
                <span className="text-white/65">Lesson {position + 1} of {total}:</span>{' '}
                <span className="font-semibold">{current.title}</span>
              </p>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn border border-white/25 bg-transparent py-2 text-white hover:bg-white/10" disabled={!previous} onClick={() => onSelect(previous)}>Previous</button>
                {current.completed && !next ? (
                  <button type="button" className="btn border border-white/25 bg-transparent py-2 text-white hover:bg-white/10" disabled={busyId === current.id} onClick={() => onToggle(current, false)}>Mark not done</button>
                ) : (
                  <button type="button" className="btn-brand py-2" disabled={busyId === current.id} onClick={onCompleteAndNext}>
                    {current.completed ? 'Next lesson' : next ? 'Mark done & next' : 'Mark done'}
                  </button>
                )}
              </div>
            </div>
            {overview ? <div className="mt-3 hidden border-t border-white/10 pt-3 text-sm text-white/75 lg:block">{overview}</div> : null}
          </div>
        </div>

        <aside className="flex min-h-[40vh] flex-col border-t border-hairline bg-white lg:min-h-0 lg:border-l lg:border-t-0" aria-label="Course content">
          <CourseContentPanel
            sections={sections}
            currentId={current.id}
            busyId={busyId}
            onSelect={onSelect}
            onToggle={(lesson) => onToggle(lesson)}
          />
        </aside>
      </div>
    </div>
  );
}
