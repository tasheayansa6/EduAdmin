import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, buildQuery } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDate } from '../lib/format.js';
import { StudentData, StudentEmpty } from '../student/components.jsx';
import { useDocumentTitle } from '../student/StudentData.jsx';

function paragraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function StudentCareersPage() {
  useDocumentTitle('Careers');
  const resource = useResource(
    () => api(`/api/v1/student/careers${buildQuery({ page: 1, limit: 24 })}`),
    [],
  );
  const rows = resource.data?.data ?? [];

  return (
    <StudentData resource={resource} label="Loading careers">
      {() => (
        <div className="space-y-6">
          <header className="hub-card p-5 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Open positions</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-charcoal sm:text-4xl">Join Us</h1>
            <p className="mt-2 max-w-2xl text-base text-charcoal-muted">
              We welcome passionate professionals, field engineers, and youth mentors.
            </p>
          </header>

          {!rows.length ? (
            <StudentEmpty
              title="No open roles"
              message="When the team publishes a vacancy, it will appear here."
              action={<Link to="/learn" className="btn-brand">Back to Explore</Link>}
            />
          ) : (
            <ul className="space-y-4">
              {rows.map((role) => (
                <li key={role.id} className="hub-card p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-charcoal">{role.employmentType}</span>
                    {role.department ? (
                      <span className="rounded-full bg-wheat/20 px-2.5 py-1 text-[11px] font-bold text-wheat-ink">{role.department}</span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-bold text-charcoal sm:text-2xl">{role.title}</h2>
                  <p className="mt-1 text-sm text-charcoal-muted">
                    {[role.location, role.summary].filter(Boolean).join(' · ')}
                  </p>
                  {role.deadline ? (
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">
                      Application deadline · {formatDate(role.deadline)}
                    </p>
                  ) : null}
                  <Link
                    to={`/learn/careers/${encodeURIComponent(role.slug)}`}
                    className="btn-brand mt-4 inline-flex"
                  >
                    View &amp; apply
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </StudentData>
  );
}

export function StudentCareerDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const resource = useResource(
    () => api(`/api/v1/student/careers/${encodeURIComponent(slug)}`),
    [slug],
  );
  const role = resource.data?.data;
  useDocumentTitle(role?.title || 'Career');

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    coverLetter: '',
    resumeUrl: '',
  });
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || user?.name || '',
      email: current.email || user?.email || '',
    }));
  }, [user]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setFieldError({});
    try {
      await api(`/api/v1/student/careers/${encodeURIComponent(slug)}/apply`, {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          coverLetter: form.coverLetter.trim(),
          resumeUrl: form.resumeUrl.trim() || null,
        },
      });
      setSent(true);
      toast.success('Application submitted. The team will follow up by email.');
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <StudentData resource={resource} label="Loading role">
      {() => {
        if (!role) {
          return (
            <StudentEmpty
              title="Role not found"
              message="This vacancy is closed or unavailable."
              action={<Link to="/learn/careers" className="btn-brand">All careers</Link>}
            />
          );
        }
        return (
          <div className="mx-auto max-w-3xl space-y-5">
            <Link to="/learn/careers" className="text-sm font-bold text-brand hover:underline">← All careers</Link>
            <article className="hub-card space-y-4 p-5 sm:p-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-charcoal">{role.employmentType}</span>
                {role.department ? (
                  <span className="rounded-full bg-wheat/20 px-2.5 py-1 text-[11px] font-bold text-wheat-ink">{role.department}</span>
                ) : null}
              </div>
              <h1 className="font-display text-3xl font-bold text-charcoal">{role.title}</h1>
              {role.location ? <p className="text-sm font-semibold text-charcoal-muted">{role.location}</p> : null}
              {role.deadline ? (
                <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">
                  Application deadline · {formatDate(role.deadline)}
                </p>
              ) : null}
              <div className="space-y-3 border-t border-hairline pt-4">
                {paragraphs(role.description).map((block) => (
                  <p key={block.slice(0, 40)} className="whitespace-pre-wrap text-base leading-relaxed text-charcoal">{block}</p>
                ))}
              </div>
            </article>

            <section className="hub-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-bold text-charcoal">Apply</h2>
              <p className="mt-1 text-sm text-charcoal-muted">
                Your application is saved for the team and notified at tasheayansa6@gmail.com.
              </p>
              {sent ? (
                <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
                  Application sent. Thank you.
                </p>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
                  <label className="block text-sm font-semibold text-charcoal">
                    Full name
                    <input name="name" className="s-field mt-1" value={form.name} onChange={update} required />
                    {fieldError.name ? <span className="mt-1 block text-xs text-red-700">{fieldError.name}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Email
                    <input name="email" type="email" className="s-field mt-1" value={form.email} onChange={update} required />
                    {fieldError.email ? <span className="mt-1 block text-xs text-red-700">{fieldError.email}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Phone
                    <input name="phone" className="s-field mt-1" value={form.phone} onChange={update} />
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Cover letter
                    <textarea name="coverLetter" rows="6" className="s-field mt-1" value={form.coverLetter} onChange={update} required />
                    {fieldError.coverLetter ? <span className="mt-1 block text-xs text-red-700">{fieldError.coverLetter}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Resume URL <span className="font-normal text-charcoal-muted">(optional)</span>
                    <input name="resumeUrl" className="s-field mt-1" value={form.resumeUrl} onChange={update} placeholder="https://…" />
                    {fieldError.resumeUrl ? <span className="mt-1 block text-xs text-red-700">{fieldError.resumeUrl}</span> : null}
                  </label>
                  <button type="submit" className="btn-brand w-full" disabled={pending}>
                    {pending ? 'Submitting…' : 'Submit application'}
                  </button>
                </form>
              )}
            </section>
          </div>
        );
      }}
    </StudentData>
  );
}
