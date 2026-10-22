/** Explore menu taxonomy. Live AILG catalog courses stay inside EduAdmin routes. */

export const AILG_SITE_URL = 'https://test.ailgagro.com/';
export const AILG_ACADEMY_PATH = '/learn/academy';

export const EXPLORE_GOALS = [
  {
    id: 'learn-ai',
    label: 'Learn AI',
    query: 'AI',
    children: [
      { label: 'AI Fundamentals', query: 'AI Fundamentals' },
      { label: 'AI For Professionals', query: 'AI Professional' },
      { label: 'AI For Developers', query: 'AI Developer' },
      { label: 'AI For Creatives', query: 'AI Creative' },
    ],
  },
  {
    id: 'career',
    label: 'Launch a new career',
    query: 'career',
    children: [
      { label: 'Web Development', query: 'Web Development' },
      { label: 'Data Science', query: 'Data Science' },
      { label: 'Digital Marketing', query: 'Digital Marketing' },
      { label: 'UX Design', query: 'UX Design' },
    ],
  },
  {
    id: 'certification',
    label: 'Prepare for a certification',
    query: 'certification',
    children: [
      { label: 'Cloud certifications', query: 'Cloud certification' },
      { label: 'Project Management', query: 'PMP' },
      { label: 'IT certifications', query: 'CompTIA' },
      { label: 'Finance certifications', query: 'CFA' },
    ],
  },
  {
    id: 'practice',
    label: 'Practice with Role Play',
    query: 'practice',
    children: [
      { label: 'Interview prep', query: 'Interview' },
      { label: 'Public speaking', query: 'Public speaking' },
      { label: 'Leadership', query: 'Leadership' },
      { label: 'Sales skills', query: 'Sales' },
    ],
  },
];

export function coursesPath({ q, category } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const qs = params.toString();
  return qs ? `/learn/courses?${qs}` : '/learn/courses';
}

export function itemHref(item) {
  if (item.to) return item.to;
  if (item.slug) return `/learn/courses/${item.slug}`;
  if (item.category) return coursesPath({ category: item.category });
  if (item.query) return coursesPath({ q: item.query });
  return '/learn/courses';
}

/**
 * Build Explore categories from the AILG catalog already loaded inside EduAdmin.
 * Each category lists real courses that open on /learn/courses/:slug (stays in-app).
 */
export function buildLiveExplore(courses = []) {
  const byCategory = new Map();

  for (const course of courses) {
    const category = String(course.category || course.categoryName || 'General').trim() || 'General';
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(course);
  }

  return [...byCategory.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, list]) => {
      const sorted = [...list].sort((a, b) => String(a.title).localeCompare(String(b.title)));
      return {
        id: `cat-${label}`,
        label,
        category: label,
        children: [
          { label: `All ${label}`, category: label },
          ...sorted.slice(0, 12).map((course) => ({
            label: course.title,
            slug: course.slug,
            to: course.slug ? `/learn/courses/${course.slug}` : coursesPath({ category: label }),
          })),
        ],
      };
    });
}
