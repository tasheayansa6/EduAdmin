import { useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate } from '../lib/format.js';
import { linesToList, validateCourse } from '../lib/validate.js';
import {
  DataPanel,
  Field,
  Filters,
  Modal,
  PageIntro,
  Pagination,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextArea,
  TextInput,
} from '../components/ui.jsx';

const emptyLesson = () => ({
  id: null,
  title: '',
  type: 'video',
  durationMinutes: '',
  videoUrl: '',
  pdfUrl: '',
  content: '',
  isPreview: false,
});

const emptySection = () => ({ id: null, title: '', lessons: [emptyLesson()] });

const emptyCourse = {
  title: '',
  subtitle: '',
  description: '',
  categoryId: '',
  status: 'published',
  price: '0',
  currency: 'ETB',
  imageUrl: '',
  previewVideoUrl: '',
  instructorName: '',
  level: '',
  language: 'English',
  outcomesText: '',
  requirementsText: '',
  includesText: '',
  sections: [emptySection()],
};

function toForm(course) {
  const sections = Array.isArray(course.outline) && course.outline.length
    ? course.outline.map((section) => ({
      id: section.id ?? null,
      title: section.title || '',
      lessons: (section.lessons || []).map((lesson) => ({
        id: lesson.id ?? null,
        title: lesson.title || '',
        type: lesson.type === 'lesson' ? (lesson.videoUrl ? 'video' : lesson.pdfUrl ? 'pdf' : 'article') : (lesson.type || 'video'),
        durationMinutes: lesson.durationMinutes == null ? '' : String(lesson.durationMinutes),
        videoUrl: lesson.videoUrl || '',
        pdfUrl: lesson.pdfUrl || '',
        content: lesson.content || '',
        isPreview: Boolean(lesson.isPreview),
      })),
    }))
    : [emptySection()];
  return {
    title: course.title || '',
    subtitle: course.subtitle || '',
    description: course.description || '',
    categoryId: course.categoryId ? String(course.categoryId) : '',
    status: course.status || 'draft',
    price: course.price == null ? '0' : String(course.price),
    currency: course.currency || 'ETB',
    imageUrl: course.imageUrl || '',
    previewVideoUrl: course.previewVideoUrl || '',
    instructorName: course.instructorName || '',
    level: course.level || '',
    language: course.language || 'English',
    outcomesText: course.outcomesText ?? (course.outcomes || []).join('\n'),
    requirementsText: course.requirementsText ?? (course.requirements || []).join('\n'),
    includesText: course.includesText ?? (course.includes || []).join('\n'),
    sections,
  };
}

/** Adds https:// when admins paste youtu.be / www.youtube.com without a protocol. */
function normalizeMediaUrl(value) {
  let url = String(value || '').trim();
  if (!url) return null;
  if (/^\/\//.test(url)) url = `https:${url}`;
  else if (!/^https?:\/\//i.test(url)
    && /^(www\.|youtu\.be\/|m\.youtube\.com\/|music\.youtube\.com\/|youtube\.com\/|youtube-nocookie\.com\/|vimeo\.com\/|player\.vimeo\.com\/)/i.test(url)) {
    url = `https://${url}`;
  }
  if (!/^https?:\/\//i.test(url)) return null;
  return url.slice(0, 500);
}

function sectionsPayload(sections) {
  return sections
    .map((section) => ({
      id: section.id || undefined,
      title: section.title.trim(),
      lessons: section.lessons
        .filter((lesson) => lesson.title.trim())
        .map((lesson) => {
          const videoUrl = normalizeMediaUrl(lesson.videoUrl);
          const pdfUrl = normalizeMediaUrl(lesson.pdfUrl);
          let type = lesson.type || 'article';
          if (videoUrl && type === 'article') type = 'video';
          if (pdfUrl && !videoUrl && type === 'article') type = 'pdf';
          return {
            id: lesson.id || undefined,
            title: lesson.title.trim(),
            type,
            durationMinutes: lesson.durationMinutes === '' ? null : Number(lesson.durationMinutes),
            videoUrl,
            pdfUrl,
            content: lesson.content.trim() || null,
            isPreview: Boolean(lesson.isPreview),
          };
        }),
    }))
    .filter((section) => section.title && section.lessons.length);
}

export function CoursesPage() {
  const toast = useToast();
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/courses${buildQuery({
      q: list.q,
      status: list.status,
      categoryId: list.categoryId,
      page: list.page,
      limit: 6,
    })}`),
    [list.q, list.status, list.categoryId, list.page],
  );
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const [editing, setEditing] = useState(null);
  const categories = lookups.data?.data.categories ?? [];
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status || list.categoryId);

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setEditing(emptyCourse)}>New course</button>}>
        Build student courses: cover image, outcomes, outline, price, and publish. Students see the same details on Explore and the course page.
      </PageIntro>
      <Filters onSubmit={(event) => {
        event.preventDefault();
        list.update({ q: list.draft.trim(), status: list.status, categoryId: list.categoryId });
      }}
      >
        <Field id="course-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput id="course-search" value={list.draft} onChange={(event) => list.setDraft(event.target.value)} placeholder="Title or description" />
        </Field>
        <Field id="course-category" label="Category">
          <SelectInput id="course-category" value={list.categoryId} onChange={(event) => list.update({ q: list.q, status: list.status, categoryId: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
        </Field>
        <Field id="course-status" label="Status">
          <SelectInput id="course-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value, categoryId: list.categoryId })}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </SelectInput>
        </Field>
        <button type="submit" className="btn-primary">Search</button>
      </Filters>
      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching courses' : 'No courses yet'}
        emptyMessage={filtered ? 'Try another title, category, or status.' : 'Create the first course for students.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Students</th>
                <th>Updated</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => (
                <tr key={course.id}>
                  <td className="max-w-xs">
                    <div className="flex gap-3">
                      {course.imageUrl ? (
                        <img src={course.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded object-cover bg-sand" />
                      ) : null}
                      <div className="min-w-0">
                        <div className="font-semibold">{course.title}</div>
                        <div className="mt-1 line-clamp-2 text-ink-muted">{course.subtitle || course.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>{course.categoryName}</td>
                  <td className="tabular-nums whitespace-nowrap">
                    {Number(course.price) > 0 ? `${course.currency || 'ETB'} ${Number(course.price).toLocaleString('en')}` : 'Free'}
                  </td>
                  <td><StatusBadge status={course.status} /></td>
                  <td className="tabular-nums">{course.enrollmentCount}</td>
                  <td>{formatDate(course.updatedAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setEditing(course)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
      {editing ? (
        <CourseDialog
          course={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            toast.success(message);
            setEditing(null);
            resource.reload();
            lookups.reload();
          }}
        />
      ) : null}
    </>
  );
}

function OutlineEditor({ sections, onChange, error }) {
  function patchSection(index, patch) {
    onChange(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function patchLesson(sectionIndex, lessonIndex, patch) {
    onChange(sections.map((section, i) => {
      if (i !== sectionIndex) return section;
      return {
        ...section,
        lessons: section.lessons.map((lesson, j) => (j === lessonIndex ? { ...lesson, ...patch } : lesson)),
      };
    }));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">Lessons (video / PDF / reading)</h4>
          <p className="text-xs text-ink-muted">Paste YouTube, Vimeo, direct video, or PDF links. Students open them in the course player after enrolling.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => onChange([...sections, emptySection()])}>Add section</button>
      </div>
      {error ? <p className="mb-2 text-sm text-red-800">{typeof error === 'string' ? error : 'Check the outline.'}</p> : null}
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="rounded-xl border border-line bg-slate-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field id={`section-title-${sectionIndex}`} label={`Section ${sectionIndex + 1}`} className="min-w-0 flex-1">
                <TextInput
                  id={`section-title-${sectionIndex}`}
                  value={section.title}
                  onChange={(event) => patchSection(sectionIndex, { title: event.target.value })}
                  placeholder="Getting started"
                />
              </Field>
              <button
                type="button"
                className="btn-secondary"
                disabled={sections.length <= 1}
                onClick={() => onChange(sections.filter((_, i) => i !== sectionIndex))}
              >
                Remove section
              </button>
            </div>
            <ul className="mt-3 space-y-3">
              {section.lessons.map((lesson, lessonIndex) => (
                <li key={lessonIndex} className="rounded-xl border border-line bg-white p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
                    <Field id={`lesson-title-${sectionIndex}-${lessonIndex}`} label="Lesson title">
                      <TextInput
                        id={`lesson-title-${sectionIndex}-${lessonIndex}`}
                        value={lesson.title}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { title: event.target.value })}
                        placeholder="Welcome video"
                      />
                    </Field>
                    <Field id={`lesson-type-${sectionIndex}-${lessonIndex}`} label="Type">
                      <SelectInput
                        id={`lesson-type-${sectionIndex}-${lessonIndex}`}
                        value={lesson.type}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { type: event.target.value })}
                      >
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="article">Reading</option>
                      </SelectInput>
                    </Field>
                    <Field id={`lesson-mins-${sectionIndex}-${lessonIndex}`} label="Minutes">
                      <TextInput
                        id={`lesson-mins-${sectionIndex}-${lessonIndex}`}
                        type="number"
                        min="0"
                        value={lesson.durationMinutes}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { durationMinutes: event.target.value })}
                      />
                    </Field>
                  </div>
                  {lesson.type === 'video' ? (
                    <Field id={`lesson-video-${sectionIndex}-${lessonIndex}`} label="Video URL" className="mt-3">
                      <TextInput
                        id={`lesson-video-${sectionIndex}-${lessonIndex}`}
                        value={lesson.videoUrl}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { videoUrl: event.target.value })}
                        placeholder="youtu.be/… or https://youtube.com/watch?v=…"
                      />
                      <p className="mt-1 text-xs text-ink-muted">YouTube, Vimeo, or a direct .mp4 link. https:// is added automatically if missing.</p>
                    </Field>
                  ) : null}
                  {lesson.type === 'pdf' ? (
                    <Field id={`lesson-pdf-${sectionIndex}-${lessonIndex}`} label="PDF URL" className="mt-3">
                      <TextInput
                        id={`lesson-pdf-${sectionIndex}-${lessonIndex}`}
                        value={lesson.pdfUrl}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { pdfUrl: event.target.value })}
                        placeholder="https://…/file.pdf"
                      />
                    </Field>
                  ) : null}
                  {lesson.type === 'article' ? (
                    <Field id={`lesson-content-${sectionIndex}-${lessonIndex}`} label="Reading text" className="mt-3">
                      <TextArea
                        id={`lesson-content-${sectionIndex}-${lessonIndex}`}
                        rows="3"
                        value={lesson.content}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { content: event.target.value })}
                        placeholder="Optional article or notes for this lesson"
                      />
                    </Field>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={lesson.isPreview}
                        onChange={(event) => patchLesson(sectionIndex, lessonIndex, { isPreview: event.target.checked })}
                      />
                      Free preview (visible before enroll)
                    </label>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={section.lessons.length <= 1}
                      onClick={() => patchSection(sectionIndex, { lessons: section.lessons.filter((_, j) => j !== lessonIndex) })}
                    >
                      Remove lesson
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={() => patchSection(sectionIndex, { lessons: [...section.lessons, emptyLesson()] })}
            >
              Add lesson
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseDialog({ course, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(course.id ? course : emptyCourse));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(''); // '' | 'unpublish' | 'delete'

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCourse(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    const body = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim(),
      categoryId: Number(form.categoryId),
      status: form.status,
      price: Number(form.price),
      currency: form.currency.trim().toUpperCase() || 'ETB',
      imageUrl: normalizeMediaUrl(form.imageUrl) || (form.imageUrl.trim() || null),
      previewVideoUrl: normalizeMediaUrl(form.previewVideoUrl),
      instructorName: form.instructorName.trim() || null,
      level: form.level || null,
      language: form.language.trim() || 'English',
      outcomes: linesToList(form.outcomesText),
      requirements: linesToList(form.requirementsText),
      includes: linesToList(form.includesText),
      outline: sectionsPayload(form.sections),
    };
    setPending(true);
    try {
      if (course.id) {
        await api(`/api/v1/courses/${course.id}`, { method: 'PATCH', body });
        if (body.status === 'published' && course.status !== 'published') {
          onSaved('Course published. Students can see it now and were notified.');
        } else {
          onSaved('Course updated.');
        }
      } else {
        await api('/api/v1/courses', { method: 'POST', body });
        onSaved(body.status === 'published'
          ? 'Course published. Students can see it now and were notified.'
          : 'Course saved as a draft. Students will not see it until you publish it.');
      }
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(error.message);
    } finally {
      setPending(false);
    }
  }

  async function unpublish() {
    setPending(true);
    try {
      await api(`/api/v1/courses/${course.id}`, { method: 'PATCH', body: { status: 'draft' } });
      onSaved('Course unpublished and moved to draft.');
    } catch (error) {
      setConfirming('');
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await api(`/api/v1/courses/${course.id}`, { method: 'DELETE' });
      onSaved('Course deleted permanently.');
    } catch (error) {
      setConfirming('');
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
    <Modal title={course.id ? 'Edit course' : 'New course'} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {formError ? <p role="alert" className="text-sm font-semibold text-red-800">{formError}</p> : null}

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Basics</h3>
          <Field id="course-title" label="Title" error={errors.title}>
            <TextInput id="course-title" name="title" value={form.title} error={errors.title} onChange={update} />
          </Field>
          <Field id="course-subtitle" label="Subtitle" error={errors.subtitle}>
            <TextInput id="course-subtitle" name="subtitle" value={form.subtitle} error={errors.subtitle} onChange={update} placeholder="One line students see under the title" />
          </Field>
          <Field id="course-description" label="Description" error={errors.description}>
            <TextArea id="course-description" name="description" rows="4" value={form.description} error={errors.description} onChange={update} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="course-edit-category" label="Category" error={errors.categoryId}>
              <SelectInput id="course-edit-category" name="categoryId" value={form.categoryId} error={errors.categoryId} onChange={update}>
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </SelectInput>
            </Field>
            <Field id="course-edit-status" label="Status" error={errors.status}>
              <SelectInput id="course-edit-status" name="status" value={form.status} error={errors.status} onChange={update}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </SelectInput>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field id="course-edit-price" label="Price" error={errors.price}>
              <TextInput id="course-edit-price" name="price" type="number" min="0" step="0.01" value={form.price} error={errors.price} onChange={update} />
              <p className="mt-1 text-xs text-ink-muted">
                {Number(form.price) > 0 ? 'Paid: students use cart and Chapa.' : 'Free: students enroll from the course page.'}
              </p>
            </Field>
            <Field id="course-edit-currency" label="Currency" error={errors.currency}>
              <TextInput id="course-edit-currency" name="currency" value={form.currency} error={errors.currency} onChange={update} maxLength={3} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-line pt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Presentation</h3>
          <Field id="course-image" label="Cover image URL" error={errors.imageUrl}>
            <TextInput id="course-image" name="imageUrl" value={form.imageUrl} error={errors.imageUrl} onChange={update} placeholder="https://…" />
          </Field>
          <Field id="course-preview" label="Preview video URL" error={errors.previewVideoUrl}>
            <TextInput id="course-preview" name="previewVideoUrl" value={form.previewVideoUrl} error={errors.previewVideoUrl} onChange={update} placeholder="YouTube, Vimeo, or direct video link" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="course-instructor" label="Instructor" error={errors.instructorName}>
              <TextInput id="course-instructor" name="instructorName" value={form.instructorName} error={errors.instructorName} onChange={update} />
            </Field>
            <Field id="course-level" label="Level" error={errors.level}>
              <SelectInput id="course-level" name="level" value={form.level} error={errors.level} onChange={update}>
                <option value="">Not set</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </SelectInput>
            </Field>
            <Field id="course-language" label="Language" error={errors.language}>
              <TextInput id="course-language" name="language" value={form.language} error={errors.language} onChange={update} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 border-t border-line pt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Student page content</h3>
          <Field id="course-outcomes" label="What you’ll learn" error={errors.outcomes}>
            <TextArea id="course-outcomes" name="outcomesText" rows="4" value={form.outcomesText} error={errors.outcomes} onChange={update} placeholder="One outcome per line" />
          </Field>
          <Field id="course-requirements" label="Requirements" error={errors.requirements}>
            <TextArea id="course-requirements" name="requirementsText" rows="3" value={form.requirementsText} error={errors.requirements} onChange={update} placeholder="One requirement per line" />
          </Field>
          <Field id="course-includes" label="This course includes" error={errors.includes}>
            <TextArea id="course-includes" name="includesText" rows="3" value={form.includesText} error={errors.includes} onChange={update} placeholder="One item per line" />
          </Field>
          <OutlineEditor
            sections={form.sections}
            error={errors.outline}
            onChange={(sections) => setForm((current) => ({ ...current, sections }))}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {course.id && course.status === 'published' ? (
              <button type="button" className="btn-secondary" onClick={() => setConfirming('unpublish')}>
                Unpublish
              </button>
            ) : null}
            {course.id ? (
              <button type="button" className="btn-danger" onClick={() => setConfirming('delete')}>
                Delete course
              </button>
            ) : <span />}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save course'}</button>
          </div>
        </div>
      </form>
    </Modal>

    {confirming === 'unpublish' ? (
      <Modal title="Unpublish course" onClose={() => setConfirming('')}>
        <p className="text-sm leading-relaxed text-ink">
          Unpublish “{course.title}”? It moves to draft and students can no longer find it in the catalog.
          Existing enrollments and progress are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={pending} onClick={() => setConfirming('')}>
            Keep published
          </button>
          <button type="button" className="btn-primary" disabled={pending} onClick={unpublish}>
            {pending ? 'Unpublishing…' : 'Unpublish'}
          </button>
        </div>
      </Modal>
    ) : null}

    {confirming === 'delete' ? (
      <Modal title="Delete course" onClose={() => { if (!pending) setConfirming(''); }}>
        <p className="text-sm leading-relaxed text-ink">
          Permanently delete “{course.title}”? This cannot be undone.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Enrollments, lesson progress, cart items, and favorites for this course will also be removed.
          {course.enrollmentCount ? (
            <>
              {' '}
              <span className="font-semibold text-red-800">
                {course.enrollmentCount} active enrollment{course.enrollmentCount === 1 ? '' : 's'} will be deleted.
              </span>
            </>
          ) : null}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={pending} onClick={() => setConfirming('')}>
            Cancel
          </button>
          <button type="button" className="btn-danger" disabled={pending} onClick={remove}>
            {pending ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Modal>
    ) : null}
    </>
  );
}
