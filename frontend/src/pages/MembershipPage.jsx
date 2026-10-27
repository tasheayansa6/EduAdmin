import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDateTime } from '../lib/format.js';
import {
  DataPanel,
  Field,
  PageIntro,
  TextArea,
  TextInput,
} from '../components/ui.jsx';

const emptyForm = {
  enabled: true,
  eyebrow: '',
  headline: '',
  intro: '',
  ctaLabel: '',
  ctaUrl: '',
};

export function MembershipPage() {
  const toast = useToast();
  const resource = useResource(() => api('/api/v1/membership'), []);
  const [form, setForm] = useState(emptyForm);
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const data = resource.data?.data;
    if (!data) return;
    setForm({
      enabled: Boolean(data.enabled),
      eyebrow: data.eyebrow || '',
      headline: data.headline || '',
      intro: data.intro || '',
      ctaLabel: data.ctaLabel || '',
      ctaUrl: data.ctaUrl || '',
    });
  }, [resource.data]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setFieldError({});
    try {
      await api('/api/v1/membership', {
        method: 'PUT',
        body: {
          enabled: form.enabled,
          eyebrow: form.eyebrow.trim(),
          headline: form.headline.trim(),
          intro: form.intro.trim() || null,
          ctaLabel: form.ctaLabel.trim(),
          ctaUrl: form.ctaUrl.trim(),
        },
      });
      toast.success('Membership CTA saved.');
      resource.reload();
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  const data = resource.data?.data;

  return (
    <>
      <PageIntro>
        Control the AILG membership card on the student Explore page. Edit copy and the join link, or hide the card.
      </PageIntro>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DataPanel
          status={resource.status}
          error={resource.error}
          onRetry={resource.reload}
          loadingLabel="Loading membership settings"
        >
          <form onSubmit={save} className="space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="enabled"
                checked={form.enabled}
                onChange={update}
                className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">Show on student Explore</span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  When off, the cream membership card is hidden from learners.
                </span>
              </span>
            </label>

            <Field id="membership-eyebrow" label="Eyebrow" error={fieldError.eyebrow}>
              <TextInput id="membership-eyebrow" name="eyebrow" value={form.eyebrow} onChange={update} required maxLength={80} />
            </Field>
            <Field id="membership-headline" label="Headline" error={fieldError.headline}>
              <TextInput id="membership-headline" name="headline" value={form.headline} onChange={update} required maxLength={255} />
            </Field>
            <Field id="membership-intro" label="Supporting text" error={fieldError.intro}>
              <TextArea id="membership-intro" name="intro" value={form.intro} onChange={update} rows={4} maxLength={2000} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="membership-cta-label" label="Button label" error={fieldError.ctaLabel}>
                <TextInput id="membership-cta-label" name="ctaLabel" value={form.ctaLabel} onChange={update} required maxLength={80} />
              </Field>
              <Field id="membership-cta-url" label="Button URL" error={fieldError.ctaUrl}>
                <TextInput id="membership-cta-url" name="ctaUrl" type="url" value={form.ctaUrl} onChange={update} required maxLength={500} />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Save membership'}
              </button>
              {data?.updatedAt ? (
                <p className="text-sm text-ink-muted">Last saved {formatDateTime(data.updatedAt)}</p>
              ) : null}
            </div>
          </form>
        </DataPanel>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-[#fbfcf9] shadow-soft">
            <div className="border-b border-line/80 bg-gradient-to-r from-emerald-50 via-transparent to-amber-50/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
                {form.eyebrow || 'AILG membership'}
              </p>
            </div>
            <div className="space-y-3 p-4">
              <h3 className="font-display text-xl font-extrabold text-ink">
                {form.headline || 'Join the membership'}
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {form.intro || 'Supporting text appears here.'}
              </p>
              <span className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-100 px-4 text-sm font-bold text-emerald-900">
                {form.ctaLabel || 'Join membership'}
              </span>
              {!form.enabled ? (
                <p className="text-center text-xs font-semibold text-amber-800">Hidden on Explore while disabled</p>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            Default link points to the AILG site membership section. Change it when you have an in-app membership flow.
          </p>
        </aside>
      </div>
    </>
  );
}
