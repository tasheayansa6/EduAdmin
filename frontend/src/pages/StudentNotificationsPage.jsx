import { useState } from 'react';
import { useDocumentTitle } from '../student/StudentData.jsx';
import { PageSkeleton, PageTitle, StudentEmpty, StudentError } from '../student/components.jsx';
import { NotificationItem, useNotifications, useOpenNotification } from '../student/notifications.jsx';

export function StudentNotificationsPage() {
  useDocumentTitle('Notifications');
  const { items, unread, status, error, reload, markRead } = useNotifications();
  const open = useOpenNotification();
  const [filter, setFilter] = useState('all');
  const visible = filter === 'unread' ? items.filter((item) => !item.read) : items;

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'error') return <StudentError title="Notifications could not be loaded" error={error} onRetry={reload} />;

  return (
    <>
      <PageTitle title="Notifications" description="Updates about your enrollments, payments, finished courses and account security." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Show">
          {[['all', `All (${items.length})`], ['unread', `Unread (${unread})`]].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} className={filter === key ? 'chip-on' : 'chip-off'} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-outline" disabled={!unread} onClick={() => markRead()}>Mark all as read</button>
      </div>
      {visible.length ? (
        <ul className="s-card divide-y divide-hairline overflow-hidden">
          {visible.map((item) => <li key={item.id}><NotificationItem item={item} onOpen={open} /></li>)}
        </ul>
      ) : (
        <StudentEmpty
          title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
          message={filter === 'unread' ? 'There are no unread notifications.' : 'Enrollments, payments, finished courses and password changes will show up here.'}
        />
      )}
      {items.length >= 50 ? <p className="mt-3 text-sm text-charcoal-muted">Showing your 50 most recent notifications.</p> : null}
    </>
  );
}
