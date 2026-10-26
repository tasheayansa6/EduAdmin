import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { CoursePlayerChrome } from '../student/CoursePlayerLayout.jsx';
import { StudentData, StudentEmpty } from '../student/components.jsx';

function PlayerBody({ initial }) {
  const { afterEnrollment } = useStore();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [course, setCourse] = useState(initial);
  const [busyId, setBusyId] = useState(null);
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

  return (
    <CoursePlayerChrome
      title={course.title}
      backTo={`/learn/my-courses/${course.courseId}`}
      progress={course.progress}
      current={current}
      position={position}
      total={lessons.length}
      previous={previous}
      next={next}
      busyId={busyId}
      onSelect={select}
      onToggle={toggle}
      onCompleteAndNext={completeAndNext}
      sections={course.sections}
    />
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
