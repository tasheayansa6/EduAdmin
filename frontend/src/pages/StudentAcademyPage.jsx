import { AILG_SITE_URL } from '../student/exploreMenu.js';
import { useDocumentTitle } from '../student/StudentData.jsx';

/** Opens the AILG Academy site inside EduAdmin so Explore stays on this website. */
export function StudentAcademyPage() {
  useDocumentTitle('AILG Academy');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="border-b border-hairline bg-white px-4 py-3 sm:px-6">
        <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">AILG Academy</h1>
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
