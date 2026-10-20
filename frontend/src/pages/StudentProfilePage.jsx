import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { api, setToken } from '../api/client.js';
import { Avatar } from '../components/ui.jsx';
import { LinkIcon } from '../components/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fieldErrors, formatDate } from '../lib/format.js';
import { useDocumentTitle } from '../student/StudentData.jsx';
import { useNotifications } from '../student/notifications.jsx';
import { PageSkeleton, StudentError } from '../student/components.jsx';

const LANGUAGES = [
  ['en', 'English'],
  ['am', 'Amharic (አማርኛ)'],
  ['om', 'Afaan Oromoo'],
  ['ti', 'Tigrinya (ትግርኛ)'],
  ['so', 'Somali (Soomaali)'],
  ['ar', 'Arabic (العربية)'],
  ['fr', 'French (Français)'],
];

const LINKS = [
  { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com', url: (value) => value },
  { key: 'facebook', label: 'Facebook', prefix: 'facebook.com/', placeholder: 'Username', url: (value) => `https://www.facebook.com/${value}` },
  { key: 'instagram', label: 'Instagram', prefix: 'instagram.com/', placeholder: 'Username', url: (value) => `https://www.instagram.com/${value}` },
  { key: 'linkedin', label: 'LinkedIn', prefix: 'linkedin.com/', placeholder: 'Public profile URL', hint: 'Enter the part after linkedin.com/, for example in/johnsmith or company/ailg.', url: (value) => `https://www.linkedin.com/${value}` },
  { key: 'tiktok', label: 'TikTok', prefix: 'tiktok.com/@', placeholder: 'Username', url: (value) => `https://www.tiktok.com/@${value}` },
  { key: 'x', label: 'X', prefix: 'x.com/', placeholder: 'Username', url: (value) => `https://x.com/${value}` },
  { key: 'youtube', label: 'YouTube', prefix: 'youtube.com/', placeholder: 'Username', url: (value) => `https://www.youtube.com/${value}` },
];

const FIELDS = ['firstName', 'lastName', 'headline', 'biography', 'language', ...LINKS.map((link) => link.key)];
const toForm = (profile) => Object.fromEntries(FIELDS.map((key) => [key, profile[key] ?? '']));

const SIDEBAR = [
  { to: '/learn/profile', label: 'Public profile', end: true },
  { to: '/learn/profile/security', label: 'Account security' },
  { to: '/learn/notifications', label: 'Notifications' },
];

function invalid(error) {
  return error ? 'border-red-700 focus:border-red-700 focus:ring-red-700/20' : '';
}

function FieldError({ id, error }) {
  return error ? <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-red-800">{error}</p> : null;
}

function describedBy(id, error, hint) {
  return [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
}

/** Loads the profile once for all profile tabs. */
export function StudentProfileLayout() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', profile: null, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const result = await api('/api/v1/student/profile');
      setState({ status: 'ready', profile: result.data, error: null });
    } catch (error) {
      setState({ status: 'error', profile: null, error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') return <PageSkeleton label="Loading your profile" />;
  if (state.status === 'error') return <StudentError title="Your profile could not be loaded" error={state.error} onRetry={load} />;
  const { profile } = state;

  return (
    <div className="s-card grid overflow-hidden md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-hairline p-5 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 md:flex-col md:text-center">
          <Avatar name={user.name} size="xl" tone="brand" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-charcoal md:mt-2">{user.name}</p>
            {profile.headline ? <p className="text-sm text-charcoal-muted">{profile.headline}</p> : null}
          </div>
        </div>
        <Link to="/learn/profile/public" className="mt-4 block text-center text-sm font-semibold text-brand hover:underline">View public profile</Link>
        <nav aria-label="Profile" className="mt-5">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {SIDEBAR.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-brand text-white' : 'text-charcoal hover:bg-sand'}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet context={{ profile, setProfile: (next) => setState((current) => ({ ...current, profile: next })) }} />
      </section>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-hairline px-6 py-6 text-center">
      <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
      <p className="mt-1 text-sm text-charcoal-muted">{description}</p>
    </div>
  );
}

export function StudentPublicProfileForm() {
  useDocumentTitle('Public profile');
  const { profile, setProfile } = useOutletContext();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(profile));
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const saved = toForm(profile);
  const dirty = FIELDS.some((key) => String(form[key]).trim() !== String(saved[key]).trim());

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Enter your first name.';
    if (form.headline.length > 60) next.headline = 'Use at most 60 characters.';
    if (/(https?:\/\/|www\.)/i.test(form.biography)) next.biography = 'Links are not permitted in your biography.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      const result = await api('/api/v1/student/profile', { method: 'PUT', body: form });
      setProfile(result.data);
      setForm(toForm(result.data));
      updateUser({ ...user, name: result.data.name });
      toast.success('Profile saved.');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <SectionHeader title="Public profile" description="Add information about yourself" />
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <fieldset className="space-y-4">
          <legend className="mb-3 text-base font-bold text-charcoal">Basics:</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['firstName', 'First Name', 'given-name'], ['lastName', 'Last Name', 'family-name']].map(([key, label, autoComplete]) => (
              <div key={key}>
                <label htmlFor={`profile-${key}`} className="sr-only">{label}</label>
                <input
                  id={`profile-${key}`}
                  className={`s-field ${invalid(errors[key])}`}
                  placeholder={label}
                  maxLength={60}
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={set(key)}
                  aria-invalid={errors[key] ? true : undefined}
                  aria-describedby={describedBy(`profile-${key}`, errors[key])}
                />
                <FieldError id={`profile-${key}`} error={errors[key]} />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="profile-headline" className="sr-only">Headline</label>
            <div className={`flex items-center rounded-lg border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${errors.headline ? 'border-red-700' : 'border-hairline'}`}>
              <input
                id="profile-headline"
                className="min-w-0 flex-1 rounded-lg bg-transparent px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal-muted/80 focus:outline-none"
                placeholder="Headline"
                maxLength={60}
                value={form.headline}
                onChange={set('headline')}
                aria-invalid={errors.headline ? true : undefined}
                aria-describedby={describedBy('profile-headline', errors.headline, true)}
              />
              <span className="px-3 text-sm tabular-nums text-charcoal-muted" aria-hidden="true">{60 - form.headline.length}</span>
            </div>
            <p id="profile-headline-hint" className="mt-1.5 text-xs text-charcoal-muted">Add a professional headline like, “Dairy farmer in Adama” or “Agronomy student”. {60 - form.headline.length} characters left.</p>
            <FieldError id="profile-headline" error={errors.headline} />
          </div>

          <div>
            <label htmlFor="profile-biography" className="sr-only">Biography</label>
            <textarea
              id="profile-biography"
              rows={6}
              maxLength={2000}
              className={`s-field resize-y ${invalid(errors.biography)}`}
              placeholder="Biography"
              value={form.biography}
              onChange={set('biography')}
              aria-invalid={errors.biography ? true : undefined}
              aria-describedby={describedBy('profile-biography', errors.biography, true)}
            />
            <p id="profile-biography-hint" className="mt-1.5 text-xs text-charcoal-muted">Links and coupon codes are not permitted in this section.</p>
            <FieldError id="profile-biography" error={errors.biography} />
          </div>

          <div>
            <label htmlFor="profile-language" className="mb-1.5 block text-sm font-semibold text-charcoal">Language</label>
            <select id="profile-language" className={`s-field ${invalid(errors.language)}`} value={form.language} onChange={set('language')}>
              {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
            <FieldError id="profile-language" error={errors.language} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-base font-bold text-charcoal">Links:</legend>
          {LINKS.map((link) => {
            const id = `profile-${link.key}`;
            const error = errors[link.key];
            return (
              <div key={link.key}>
                <label htmlFor={id} className={link.prefix ? 'sr-only' : 'mb-1.5 block text-sm font-semibold text-charcoal'}>{link.label}</label>
                {link.prefix ? (
                  <div className={`flex overflow-hidden rounded-lg border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${error ? 'border-red-700' : 'border-hairline'}`}>
                    <span className="flex items-center whitespace-nowrap border-r border-hairline bg-sand px-3 text-sm text-charcoal-muted">{link.prefix}</span>
                    <input
                      id={id}
                      className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal-muted/80 focus:outline-none"
                      placeholder={`${link.label} ${link.placeholder.toLowerCase()}`}
                      autoCapitalize="none"
                      spellCheck={false}
                      value={form[link.key]}
                      onChange={set(link.key)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy(id, error, link.hint)}
                    />
                  </div>
                ) : (
                  <input
                    id={id}
                    type="url"
                    className={`s-field ${invalid(error)}`}
                    placeholder={link.placeholder}
                    autoComplete="url"
                    value={form[link.key]}
                    onChange={set(link.key)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy(id, error)}
                  />
                )}
                {link.hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs text-charcoal-muted">{link.hint}</p> : null}
                <FieldError id={id} error={error} />
              </div>
            );
          })}
        </fieldset>

        <div className="flex items-center justify-end gap-3 border-t border-hairline pt-6">
          <button type="button" className="btn-outline" disabled={!dirty || pending} onClick={() => { setForm(saved); setErrors({}); }}>Cancel</button>
          <button type="submit" className="btn-brand" disabled={!dirty || pending}>{pending ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </form>
  );
}

export function StudentAccountSecurity() {
  useDocumentTitle('Account security');
  const { user } = useAuth();
  const { reload: reloadNotifications } = useNotifications();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.currentPassword) next.currentPassword = 'Enter your current password.';
    if (form.newPassword.length < 8) next.newPassword = 'Use at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) next.newPassword = 'Include at least one letter and one number.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'The passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    try {
      const result = await api('/api/v1/student/password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setToken(result.data.token);
      reloadNotifications();
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed. You were signed out on other devices.');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  const fields = [
    ['currentPassword', 'Current password', 'current-password'],
    ['newPassword', 'New password', 'new-password', 'At least 8 characters, with a letter and a number.'],
    ['confirmPassword', 'Retype new password', 'new-password'],
  ];

  return (
    <div>
      <SectionHeader title="Account security" description="Edit your account settings and change your password here." />
      <div className="mx-auto max-w-xl space-y-8 px-6 py-8">
        <div>
          <label htmlFor="security-email" className="mb-1.5 block text-sm font-semibold text-charcoal">Email</label>
          <input id="security-email" className="s-field" value={user.email} disabled aria-describedby="security-email-hint" />
          <p id="security-email-hint" className="mt-1.5 text-xs text-charcoal-muted">Your email is your sign-in name. Ask an administrator if it needs to change.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4 border-t border-hairline pt-6">
          <h2 className="text-base font-bold text-charcoal">Password</h2>
          {fields.map(([key, label, autoComplete, hint]) => {
            const id = `security-${key}`;
            return (
              <div key={key}>
                <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-charcoal">{label}</label>
                <input
                  id={id}
                  type={visible ? 'text' : 'password'}
                  className={`s-field ${invalid(errors[key])}`}
                  autoComplete={autoComplete}
                  maxLength={72}
                  value={form[key]}
                  onChange={set(key)}
                  aria-invalid={errors[key] ? true : undefined}
                  aria-describedby={describedBy(id, errors[key], hint)}
                />
                {hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs text-charcoal-muted">{hint}</p> : null}
                <FieldError id={id} error={errors[key]} />
              </div>
            );
          })}
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
            Show passwords
          </label>
          <p className="text-sm text-charcoal-muted">Changing your password signs you out everywhere else. This device stays signed in.</p>
          <div className="flex justify-end">
            <button type="submit" className="btn-brand" disabled={pending}>{pending ? 'Changing…' : 'Change password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StudentPublicProfilePreview() {
  useDocumentTitle('Public profile preview');
  const { profile } = useOutletContext();
  const language = LANGUAGES.find(([code]) => code === profile.language)?.[1];
  const links = LINKS.filter((link) => profile[link.key]);

  return (
    <div>
      <SectionHeader title="View public profile" description="This is how your profile reads. Only you can see this page; EduAdmin does not publish student profiles." />
      <article className="mx-auto max-w-2xl px-6 py-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={profile.name} size="xl" tone="brand" />
          <div className="min-w-0">
            <p className="eyebrow">Student</p>
            <h2 className="text-3xl font-bold tracking-tight text-charcoal">{profile.name}</h2>
            {profile.headline ? <p className="mt-1 text-base font-semibold text-charcoal-muted">{profile.headline}</p> : null}
          </div>
        </div>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><dt className="inline text-charcoal-muted">Language: </dt><dd className="inline font-semibold">{language}</dd></div>
          <div><dt className="inline text-charcoal-muted">Member since: </dt><dd className="inline font-semibold">{formatDate(profile.memberSince)}</dd></div>
        </dl>
        <h3 className="mt-8 text-lg font-bold">About me</h3>
        {profile.biography
          ? <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-charcoal">{profile.biography}</p>
          : <p className="mt-2 text-sm text-charcoal-muted">No biography yet. <Link to="/learn/profile" className="font-semibold text-brand hover:underline">Add one</Link>.</p>}
        {links.length ? (
          <>
            <h3 className="mt-8 text-lg font-bold">Links</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.key}>
                  <a href={link.url(profile[link.key])} target="_blank" rel="noopener noreferrer nofollow" className="chip-off [&_svg]:h-4 [&_svg]:w-4">
                    <LinkIcon />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    </div>
  );
}
