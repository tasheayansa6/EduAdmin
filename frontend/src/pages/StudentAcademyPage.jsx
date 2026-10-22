import { AILG_SITE_URL } from '../student/exploreMenu.js';
import { useDocumentTitle } from '../student/StudentData.jsx';

/** Opens the AILG Academy site inside EduAdmin so Explore stays on this website. */
export function StudentAcademyPage() {
  useDocumentTitle('AILG Academy');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Connected inside EduAdmin</p>
          <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">AILG Academy</h1>
          <p className="mt-0.5 truncate text-sm text-charcoal-muted">{AILG_SITE_URL}</p>
        </div>
        <a
          href={AILG_SITE_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        title="AILG Academy"
        src={AILG_SITE_URL}
        className="w-full flex-1 border-0 bg-white"
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen"
      />
    </div>
  );
}
