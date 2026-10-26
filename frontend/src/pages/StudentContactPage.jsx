import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors } from '../lib/format.js';
import { SubscribeForm } from '../components/SubscribeForm.jsx';
import { StudentData, StudentEmpty } from '../student/components.jsx';
import { useDocumentTitle } from '../student/StudentData.jsx';

export function StudentContactPage() {
  useDocumentTitle('Contact');
  const { user } = useAuth();
  const toast = useToast();
  const resource = useResource(() => api('/api/v1/student/contact'), []);
  const info = resource.data?.data;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    body: '',
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
      await api('/api/v1/student/contact/messages', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
        },
      });
      setSent(true);
      setForm((current) => ({ ...current, subject: '', body: '' }));
      toast.success('Message sent. The team will follow up.');
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  const place = [info?.addressLine, info?.city, info?.region, info?.country].filter(Boolean).join(', ');

  return (
    <StudentData resource={resource} label="Loading contact details">
      {() => {
        if (!info) {
          return (
            <StudentEmpty
              title="Contact unavailable"
              message="Contact details have not been published yet."
            />
          );
        }

        return (
          <div className="mx-auto max-w-4xl space-y-6">
            <header className="hub-card p-5 sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                {info.organizationName || 'Support'}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-charcoal sm:text-4xl">
                {info.headline || 'Contact us'}
              </h1>
              {info.intro ? (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-charcoal-muted">{info.intro}</p>
              ) : null}
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="hub-card space-y-4 p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold text-charcoal">Reach us</h2>
                <ul className="space-y-3 text-sm">
                  {info.email ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Email</p>
                      <a className="font-semibold text-brand hover:underline" href={`mailto:${info.email}`}>{info.email}</a>
                    </li>
                  ) : null}
                  {info.phone ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Phone</p>
                      <a className="font-semibold text-charcoal" href={`tel:${info.phone.replace(/\s+/g, '')}`}>{info.phone}</a>
                    </li>
                  ) : null}
                  {info.whatsapp ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">WhatsApp</p>
                      <p className="font-semibold text-charcoal">{info.whatsapp}</p>
                    </li>
                  ) : null}
                  {info.telegram ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Telegram</p>
                      <p className="font-semibold text-charcoal">{info.telegram}</p>
                    </li>
                  ) : null}
                  {place ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Address</p>
                      <p className="font-semibold text-charcoal">{place}</p>
                    </li>
                  ) : null}
                  {info.hours ? (
                    <li>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Hours</p>
                      <p className="font-semibold text-charcoal">{info.hours}</p>
                    </li>
                  ) : null}
                </ul>
                {info.mapUrl ? (
                  <a
                    href={info.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-bold text-brand hover:underline"
                  >
                    Open map
                  </a>
                ) : null}
              </section>

              <section className="hub-card space-y-3 p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold text-charcoal">Email updates</h2>
                <p className="text-sm text-charcoal-muted">
                  Subscribe with your email to receive announcements from the learning team.
                </p>
                <SubscribeForm defaultName={user?.name || ''} defaultEmail={user?.email || ''} />
              </section>

              <section className="hub-card p-5 sm:p-6 lg:col-span-2">
                <h2 className="font-display text-lg font-bold text-charcoal">Send a message</h2>
                <p className="mt-1 text-sm text-charcoal-muted">We store your message for the admin team to review.</p>
                {sent ? (
                  <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
                    Thanks — your message was sent.
                  </p>
                ) : null}
                <form className="mt-4 space-y-3" onSubmit={submit} noValidate>
                  <label className="block text-sm font-semibold text-charcoal">
                    Name
                    <input
                      name="name"
                      value={form.name}
                      onChange={update}
                      className="s-field mt-1"
                      required
                    />
                    {fieldError.name ? <span className="mt-1 block text-xs text-red-700">{fieldError.name}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Email
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={update}
                      className="s-field mt-1"
                      required
                    />
                    {fieldError.email ? <span className="mt-1 block text-xs text-red-700">{fieldError.email}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Subject
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={update}
                      className="s-field mt-1"
                      required
                    />
                    {fieldError.subject ? <span className="mt-1 block text-xs text-red-700">{fieldError.subject}</span> : null}
                  </label>
                  <label className="block text-sm font-semibold text-charcoal">
                    Message
                    <textarea
                      name="body"
                      rows="5"
                      value={form.body}
                      onChange={update}
                      className="s-field mt-1"
                      required
                    />
                    {fieldError.body ? <span className="mt-1 block text-xs text-red-700">{fieldError.body}</span> : null}
                  </label>
                  <button type="submit" className="btn-brand w-full" disabled={pending}>
                    {pending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        );
      }}
    </StudentData>
  );
}
