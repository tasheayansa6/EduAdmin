import { useState } from 'react';
import { api, buildQuery } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { formatDateTime } from '../lib/format.js';
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

export function SubscriptionsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('subscribers');
  const [testingMail, setTestingMail] = useState(false);
  const stats = useResource(() => api('/api/v1/subscriptions/stats'), []);
  const mail = useResource(() => api('/api/v1/subscriptions/mail-status'), []);
  const summary = stats.data?.data;
  const mailStatus = mail.data?.data;

  async function sendTestMail() {
    setTestingMail(true);
    try {
      const result = await api('/api/v1/subscriptions/mail-test', { method: 'POST' });
      if (result.data?.mode === 'smtp') toast.success(result.data.message);
      else toast.error(result.data?.message || 'SMTP not ready.');
      mail.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTestingMail(false);
    }
  }

  return (
    <>
      <PageIntro action={<button type="button" className="btn-primary" onClick={() => setTab('compose')}>Send email</button>}>
        Collect subscriber emails and send announcements to everyone who opted in.
      </PageIntro>

      {summary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Active</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{summary.active}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Unsubscribed</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{summary.unsubscribed}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Email delivery</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {mailStatus?.ok || summary.mailConfigured
                ? `Live SMTP → ${mailStatus?.notifyTo || 'tasheayansa6@gmail.com'}`
                : 'Needs Gmail App Password in SMTP_PASS'}
            </p>
            <button type="button" className="btn-secondary mt-3 text-xs" disabled={testingMail} onClick={sendTestMail}>
              {testingMail ? 'Sending…' : 'Send test email'}
            </button>
          </div>
        </div>
      ) : null}

      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1">
        {[
          { key: 'subscribers', label: 'Subscribers' },
          { key: 'compose', label: 'Send email' },
          { key: 'campaigns', label: 'Sent history' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.key ? 'bg-accent text-white shadow-soft' : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'subscribers' ? <SubscribersTable toast={toast} /> : null}
      {tab === 'compose' ? <ComposeForm toast={toast} onSent={() => setTab('campaigns')} /> : null}
      {tab === 'campaigns' ? <CampaignHistory /> : null}
    </>
  );
}

function SubscribersTable({ toast }) {
  const list = useListParams();
  const resource = useResource(
    () => api(`/api/v1/subscriptions${buildQuery({ q: list.q, status: list.status, page: list.page, limit: 10 })}`),
    [list.q, list.status, list.page],
  );
  const [pendingId, setPendingId] = useState(null);
  const rows = resource.data?.data ?? [];

  async function setStatus(id, status) {
    setPendingId(id);
    try {
      await api(`/api/v1/subscriptions/${id}`, { method: 'PATCH', body: { status } });
      toast.success(status === 'active' ? 'Subscriber reactivated.' : 'Subscriber unsubscribed.');
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id) {
    setPendingId(id);
    try {
      await api(`/api/v1/subscriptions/${id}`, { method: 'DELETE' });
      toast.success('Subscriber removed.');
      resource.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="sub-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="sub-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Type to search email or name"
            autoComplete="off"
          />
        </Field>
        <Field id="sub-status" label="Status">
          <SelectInput id="sub-status" value={list.status} onChange={(event) => list.update({ q: list.q, status: event.target.value })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle="No subscribers yet"
        emptyMessage="When students or visitors subscribe with their email, they appear here."
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Source</th>
                <th>Status</th>
                <th>Joined</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{row.email}</td>
                  <td>{row.name || '—'}</td>
                  <td className="capitalize">{row.source}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{formatDateTime(row.subscribedAt)}</td>
                  <td className="space-x-2 text-right">
                    {row.status === 'active' ? (
                      <button type="button" className="btn-secondary" disabled={pendingId === row.id} onClick={() => setStatus(row.id, 'unsubscribed')}>
                        Unsubscribe
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary" disabled={pendingId === row.id} onClick={() => setStatus(row.id, 'active')}>
                        Reactivate
                      </button>
                    )}
                    <button type="button" className="btn-danger" disabled={pendingId === row.id} onClick={() => remove(row.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
    </>
  );
}

function ComposeForm({ toast, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function send() {
    setPending(true);
    try {
      const result = await api('/api/v1/subscriptions/campaigns', {
        method: 'POST',
        body: { subject: subject.trim(), body: body.trim() },
      });
      const campaign = result.data;
      toast.success(
        campaign.mailConfigured
          ? `Sent to ${campaign.deliveredCount} subscriber${campaign.deliveredCount === 1 ? '' : 's'}.`
          : `Logged send to ${campaign.deliveredCount} subscriber${campaign.deliveredCount === 1 ? '' : 's'} (configure SMTP to deliver live).`,
      );
      setSubject('');
      setBody('');
      setConfirming(false);
      onSent?.();
    } catch (error) {
      toast.error(error.message);
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form
        className="surface-card max-w-3xl space-y-4 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setConfirming(true);
        }}
      >
        <Field id="campaign-subject" label="Subject">
          <TextInput id="campaign-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} />
        </Field>
        <Field id="campaign-body" label="Message">
          <TextArea
            id="campaign-body"
            rows="10"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            minLength={10}
            placeholder="Write the update that will go to every active subscriber email."
          />
        </Field>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={pending || subject.trim().length < 3 || body.trim().length < 10}>
            Review &amp; send
          </button>
        </div>
      </form>

      {confirming ? (
        <Modal title="Send to all subscribers?" onClose={() => { if (!pending) setConfirming(false); }}>
          <p className="text-sm leading-relaxed text-ink">
            This emails every <span className="font-semibold">active</span> subscriber with subject “{subject.trim()}”.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={pending} onClick={send}>
              {pending ? 'Sending…' : 'Send now'}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function CampaignHistory() {
  const resource = useResource(() => api('/api/v1/subscriptions/campaigns?limit=20'), []);
  const rows = resource.data?.data ?? [];

  return (
    <DataPanel
      status={resource.status}
      error={resource.error}
      onRetry={resource.reload}
      isEmpty={rows.length === 0}
      emptyTitle="No campaigns yet"
      emptyMessage="Send your first email from the Send email tab."
      skeleton={<TableSkeleton rows={4} />}
    >
      <div className="table-wrap overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Recipients</th>
              <th>Delivered</th>
              <th>Failed</th>
              <th>Mode</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold">{row.subject}</td>
                <td className="tabular-nums">{row.recipientCount}</td>
                <td className="tabular-nums">{row.deliveredCount}</td>
                <td className="tabular-nums">{row.failedCount}</td>
                <td className="uppercase">{row.deliveryMode}</td>
                <td>{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataPanel>
  );
}
