import { useEffect, useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { fieldErrors, formatDateTime } from '../lib/format.js';
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

const emptyInfo = {
  organizationName: '',
  headline: '',
  intro: '',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  addressLine: '',
  city: '',
  region: '',
  country: '',
  hours: '',
  mapUrl: '',
};

export function ContactPage() {
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState(emptyInfo);
  const [fieldError, setFieldError] = useState({});
  const [pending, setPending] = useState(false);
  const info = useResource(() => api('/api/v1/contact'), []);

  useEffect(() => {
    const data = info.data?.data;
    if (!data) return;
    setForm({
      organizationName: data.organizationName || '',
      headline: data.headline || '',
      intro: data.intro || '',
      email: data.email || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      telegram: data.telegram || '',
      addressLine: data.addressLine || '',
      city: data.city || '',
      region: data.region || '',
      country: data.country || '',
      hours: data.hours || '',
      mapUrl: data.mapUrl || '',
    });
  }, [info.data]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setFieldError({});
    try {
      await api('/api/v1/contact', {
        method: 'PUT',
        body: {
          organizationName: form.organizationName.trim(),
          headline: form.headline.trim() || null,
          intro: form.intro.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          telegram: form.telegram.trim() || null,
          addressLine: form.addressLine.trim() || null,
          city: form.city.trim() || null,
          region: form.region.trim() || null,
          country: form.country.trim() || null,
          hours: form.hours.trim() || null,
          mapUrl: form.mapUrl.trim() || null,
        },
      });
      toast.success('Contact Us information saved.');
      info.reload();
    } catch (error) {
      const fields = fieldErrors(error);
      setFieldError(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageIntro>
        Manage the Contact Us details students see, and review messages they send.
      </PageIntro>

      <div role="tablist" aria-label="Contact sections" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
        {[
          { key: 'info', label: 'Contact details' },
          { key: 'messages', label: 'Messages' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === item.key ? 'bg-accent text-white shadow-soft' : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <DataPanel status={info.status} error={info.error} onRetry={info.reload}>
          <form onSubmit={save} className="surface-card max-w-3xl space-y-4 p-5 sm:p-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="contact-org" label="Organization name" error={fieldError.organizationName} className="sm:col-span-2">
                <TextInput id="contact-org" name="organizationName" value={form.organizationName} error={fieldError.organizationName} onChange={update} required />
              </Field>
              <Field id="contact-headline" label="Headline" error={fieldError.headline} className="sm:col-span-2">
                <TextInput id="contact-headline" name="headline" value={form.headline} error={fieldError.headline} onChange={update} placeholder="Contact us" />
              </Field>
              <Field id="contact-intro" label="Intro" error={fieldError.intro} className="sm:col-span-2">
                <TextArea id="contact-intro" name="intro" rows="3" value={form.intro} error={fieldError.intro} onChange={update} />
              </Field>
              <Field id="contact-email" label="Email" error={fieldError.email}>
                <TextInput id="contact-email" name="email" type="email" value={form.email} error={fieldError.email} onChange={update} />
              </Field>
              <Field id="contact-phone" label="Phone" error={fieldError.phone}>
                <TextInput id="contact-phone" name="phone" value={form.phone} error={fieldError.phone} onChange={update} />
              </Field>
              <Field id="contact-whatsapp" label="WhatsApp" error={fieldError.whatsapp}>
                <TextInput id="contact-whatsapp" name="whatsapp" value={form.whatsapp} error={fieldError.whatsapp} onChange={update} placeholder="+251…" />
              </Field>
              <Field id="contact-telegram" label="Telegram" error={fieldError.telegram}>
                <TextInput id="contact-telegram" name="telegram" value={form.telegram} error={fieldError.telegram} onChange={update} placeholder="@username or t.me/…" />
              </Field>
              <Field id="contact-address" label="Address" error={fieldError.addressLine} className="sm:col-span-2">
                <TextInput id="contact-address" name="addressLine" value={form.addressLine} error={fieldError.addressLine} onChange={update} />
              </Field>
              <Field id="contact-city" label="City" error={fieldError.city}>
                <TextInput id="contact-city" name="city" value={form.city} error={fieldError.city} onChange={update} />
              </Field>
              <Field id="contact-region" label="Region" error={fieldError.region}>
                <TextInput id="contact-region" name="region" value={form.region} error={fieldError.region} onChange={update} />
              </Field>
              <Field id="contact-country" label="Country" error={fieldError.country}>
                <TextInput id="contact-country" name="country" value={form.country} error={fieldError.country} onChange={update} />
              </Field>
              <Field id="contact-hours" label="Hours" error={fieldError.hours}>
                <TextInput id="contact-hours" name="hours" value={form.hours} error={fieldError.hours} onChange={update} />
              </Field>
              <Field id="contact-map" label="Map URL" error={fieldError.mapUrl} className="sm:col-span-2">
                <TextInput id="contact-map" name="mapUrl" value={form.mapUrl} error={fieldError.mapUrl} onChange={update} placeholder="https://maps.google.com/…" />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? 'Saving…' : 'Save contact details'}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <ContactMessages />
      )}
    </>
  );
}

function ContactMessages() {
  const toast = useToast();
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/contact/messages${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 8 })}`),
    [list.q, list.status, list.page],
  );
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);
  const rows = resource.data?.data ?? [];
  const filtered = Boolean(list.q || list.status);

  async function setStatus(id, status) {
    setPending(true);
    try {
      await api(`/api/v1/contact/messages/${id}`, { method: 'PATCH', body: { status } });
      toast.success(`Marked as ${status}.`);
      setSelected(null);
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  async function remove(id) {
    setPending(true);
    try {
      await api(`/api/v1/contact/messages/${id}`, { method: 'DELETE' });
      toast.success('Message deleted.');
      setSelected(null);
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="msg-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="msg-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Type to search name, email, or subject"
            autoComplete="off"
          />
        </Field>
        <Field id="msg-status" label="Status">
          <SelectInput id="msg-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value })}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching messages' : 'No messages yet'}
        emptyMessage={filtered ? 'Try another search or status.' : 'When students send Contact Us messages, they appear here.'}
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-ink">{row.name}</div>
                    <div className="text-sm text-ink-muted">{row.email}</div>
                  </td>
                  <td className="max-w-xs truncate">{row.subject}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td className="text-right">
                    <button type="button" className="btn-secondary" onClick={() => setSelected(row)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>

      {selected ? (
        <Modal title={selected.subject} onClose={() => setSelected(null)} wide>
          <p className="text-sm text-ink-muted">
            {selected.name} · {selected.email} · {formatDateTime(selected.createdAt)}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{selected.body}</p>
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-line pt-4">
            <button type="button" className="btn-danger" disabled={pending} onClick={() => remove(selected.id)}>Delete</button>
            <div className="flex flex-wrap gap-2">
              {selected.status !== 'read' ? (
                <button type="button" className="btn-secondary" disabled={pending} onClick={() => setStatus(selected.id, 'read')}>Mark read</button>
              ) : null}
              {selected.status !== 'archived' ? (
                <button type="button" className="btn-secondary" disabled={pending} onClick={() => setStatus(selected.id, 'archived')}>Archive</button>
              ) : null}
              <button type="button" className="btn-primary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
