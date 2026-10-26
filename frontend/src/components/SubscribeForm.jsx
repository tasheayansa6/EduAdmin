import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

/** Email opt-in used on student Contact and Explore. */
export function SubscribeForm({
  endpoint = '/api/v1/student/subscribe',
  defaultName = '',
  defaultEmail = '',
  className = '',
}) {
  const toast = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    try {
      await api(endpoint, {
        method: 'POST',
        body: {
          email: email.trim(),
          name: name.trim() || null,
        },
      });
      setDone(true);
      toast.success('You are subscribed. We will email updates to this address.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className={`rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand ${className}`}>
        Subscribed — watch {email || 'your inbox'} for updates.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-charcoal">
        Name <span className="font-normal text-charcoal-muted">(optional)</span>
        <input
          className="s-field mt-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </label>
      <label className="block text-sm font-semibold text-charcoal">
        Email
        <input
          type="email"
          className="s-field mt-1"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <button type="submit" className="btn-brand w-full" disabled={pending || !email.trim()}>
        {pending ? 'Subscribing…' : 'Subscribe for email updates'}
      </button>
    </form>
  );
}
