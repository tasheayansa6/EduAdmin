import { useEffect, useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate } from '../lib/format.js';
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

const emptyForm = {
  title: '',
  excerpt: '',
  body: '',
  coverImageUrl: '',
  status: 'draft',
};

function validateBlog(form) {
  const errors = {};
  if (!form.title.trim() || form.title.trim().length < 3) errors.title = 'Enter a title of at least 3 characters.';
  if (!form.body.trim() || form.body.trim().length < 20) errors.body = 'Write at least 20 characters.';
  if (form.excerpt && form.excerpt.length > 500) errors.excerpt = 'Keep the excerpt under 500 characters.';
  if (form.coverImageUrl.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(form.coverImageUrl.trim());
    } catch {
      errors.coverImageUrl = 'Enter a full image URL starting with http:// or https://.';
    }
  }
  return errors;
}

export function BlogsPage() {
  const toast = useToast();
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/blogs${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 8 })}`),
    [list.q, list.status, list.page],
  );
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status);

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setCreating(true)}>Write blog</button>}>
        Draft and publish articles students can read from Learning → Blog.
      </PageIntro>

      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="blog-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="blog-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Type to search title or content"
            autoComplete="off"
          />
        </Field>
        <Field id="blog-status" label="Status">
          <SelectInput
            id="blog-status"
            value={list.status}
            onChange={(event) => list.update({ q: list.q, status: event.target.value })}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching posts' : 'No blog posts yet'}
        emptyMessage={filtered ? 'Try another search or status.' : 'Use Write blog to create the first post.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Published</th>
                <th>Updated</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="font-semibold text-ink">{post.title}</div>
                    {post.excerpt ? <div className="mt-0.5 line-clamp-1 text-sm text-ink-muted">{post.excerpt}</div> : null}
                  </td>
                  <td>{post.authorName || '—'}</td>
                  <td><StatusBadge status={post.status} /></td>
                  <td>{post.publishedAt ? formatDate(post.publishedAt) : '—'}</td>
                  <td>{formatDate(post.updatedAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(post.id)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>

      {creating ? (
        <BlogEditor
          onClose={() => setCreating(false)}
          onSaved={(message) => {
            toast.success(message);
            setCreating(false);
            resource.reload();
          }}
        />
      ) : null}

      {editingId ? (
        <BlogEditor
          id={editingId}
          onClose={() => setEditingId(null)}
          onSaved={(message) => {
            toast.success(message);
            setEditingId(null);
            resource.reload();
          }}
        />
      ) : null}
    </>
  );
}

function BlogEditor({ id, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    setLoading(true);
    api(`/api/v1/blogs/${id}`)
      .then((result) => {
        if (!active) return;
        const post = result.data;
        setForm({
          title: post.title || '',
          excerpt: post.excerpt || '',
          body: post.body || '',
          coverImageUrl: post.coverImageUrl || '',
          status: post.status || 'draft',
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(nextStatus) {
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      body: form.body.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      status: nextStatus || form.status,
    };
    const nextErrors = validateBlog(payload);
    setFieldError(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setPending(true);
    setError('');
    try {
      if (id) {
        await api(`/api/v1/blogs/${id}`, { method: 'PATCH', body: payload });
        onSaved(payload.status === 'published' ? 'Blog published.' : 'Blog saved.');
      } else {
        await api('/api/v1/blogs', { method: 'POST', body: payload });
        onSaved(payload.status === 'published' ? 'Blog published.' : 'Draft saved.');
      }
    } catch (saveError) {
      const fields = fieldErrors(saveError);
      setFieldError(fields);
      if (!Object.keys(fields).length) setError(saveError.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      await api(`/api/v1/blogs/${id}`, { method: 'DELETE' });
      onSaved('Blog deleted.');
    } catch (deleteError) {
      setConfirmingDelete(false);
      toast.error(deleteError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal title={id ? 'Edit blog' : 'Write blog'} onClose={onClose} wide>
        {loading ? <p className="text-sm text-ink-muted">Loading post…</p> : null}
        {error ? <p role="alert" className="text-sm font-semibold text-red-800">{error}</p> : null}
        {!loading ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            noValidate
          >
            <Field id="blog-title" label="Title" error={fieldError.title}>
              <TextInput id="blog-title" name="title" value={form.title} error={fieldError.title} onChange={update} autoFocus />
            </Field>
            <Field id="blog-excerpt" label="Excerpt" error={fieldError.excerpt}>
              <TextArea
                id="blog-excerpt"
                name="excerpt"
                rows="2"
                value={form.excerpt}
                error={fieldError.excerpt}
                onChange={update}
                placeholder="Short summary shown in the blog list"
              />
            </Field>
            <Field id="blog-cover" label="Cover image URL" error={fieldError.coverImageUrl}>
              <TextInput
                id="blog-cover"
                name="coverImageUrl"
                value={form.coverImageUrl}
                error={fieldError.coverImageUrl}
                onChange={update}
                placeholder="https://…"
              />
            </Field>
            <Field id="blog-body" label="Body" error={fieldError.body}>
              <TextArea
                id="blog-body"
                name="body"
                rows="14"
                value={form.body}
                error={fieldError.body}
                onChange={update}
                placeholder="Write the full article. Use blank lines between paragraphs."
                className="min-h-[16rem] font-sans leading-relaxed"
              />
            </Field>
            <Field id="blog-status" label="Status" error={fieldError.status}>
              <SelectInput id="blog-status" name="status" value={form.status} error={fieldError.status} onChange={update}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </SelectInput>
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              {id ? (
                <button type="button" className="btn-danger" disabled={pending} onClick={() => setConfirmingDelete(true)}>
                  Delete
                </button>
              ) : <span />}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" disabled={pending} onClick={onClose}>Cancel</button>
                <button type="button" className="btn-secondary" disabled={pending} onClick={() => save('draft')}>
                  {pending ? 'Saving…' : 'Save draft'}
                </button>
                <button type="button" className="btn-primary" disabled={pending} onClick={() => save('published')}>
                  {pending ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>

      {confirmingDelete ? (
        <Modal title="Delete blog" onClose={() => { if (!pending) setConfirmingDelete(false); }}>
          <p className="text-sm leading-relaxed text-ink">
            Permanently delete “{form.title || 'this post'}”? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" disabled={pending} onClick={() => setConfirmingDelete(false)}>
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
