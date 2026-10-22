/** Udemy-style Explore taxonomy. Links go to the courses catalog with search/category filters. */

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

export const EXPLORE_CATEGORIES = [
  {
    id: 'development',
    label: 'Development',
    category: 'Development',
    children: [
      { label: 'Web Development', query: 'Web Development' },
      { label: 'Mobile Development', query: 'Mobile' },
      { label: 'Programming Languages', query: 'Programming' },
      { label: 'Game Development', query: 'Game Development' },
      { label: 'Database Design', query: 'Database' },
      { label: 'Software Testing', query: 'Testing' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    category: 'Business',
    children: [
      { label: 'Entrepreneurship', query: 'Entrepreneurship' },
      { label: 'Communication', query: 'Communication' },
      { label: 'Management', query: 'Management' },
      { label: 'Sales', query: 'Sales' },
      { label: 'Business Strategy', query: 'Strategy' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance & Accounting',
    category: 'Finance',
    children: [
      { label: 'Accounting', query: 'Accounting' },
      { label: 'Cryptocurrency', query: 'Crypto' },
      { label: 'Finance', query: 'Finance' },
      { label: 'Investing', query: 'Investing' },
    ],
  },
  {
    id: 'it',
    label: 'IT & Software',
    category: 'IT & Software',
    children: [
      { label: 'IT Certifications', query: 'IT Certification' },
      { label: 'Network & Security', query: 'Security' },
      { label: 'Hardware', query: 'Hardware' },
      { label: 'Operating Systems', query: 'Linux' },
    ],
  },
  {
    id: 'office',
    label: 'Office Productivity',
    category: 'Office Productivity',
    children: [
      { label: 'Microsoft', query: 'Microsoft' },
      { label: 'Apple', query: 'Apple' },
      { label: 'Google', query: 'Google' },
      { label: 'SAP', query: 'SAP' },
    ],
  },
  {
    id: 'personal',
    label: 'Personal Development',
    category: 'Personal Development',
    children: [
      { label: 'Personal Transformation', query: 'Personal' },
      { label: 'Productivity', query: 'Productivity' },
      { label: 'Leadership', query: 'Leadership' },
      { label: 'Career Development', query: 'Career' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    category: 'Design',
    children: [
      { label: 'Web Design', query: 'Web Design' },
      { label: 'Graphic Design', query: 'Graphic Design' },
      { label: 'Design Tools', query: 'Figma' },
      { label: 'User Experience', query: 'UX' },
      { label: '3D & Animation', query: '3D' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    category: 'Marketing',
    children: [
      { label: 'Digital Marketing', query: 'Digital Marketing' },
      { label: 'Social Media', query: 'Social Media' },
      { label: 'Content Marketing', query: 'Content Marketing' },
      { label: 'SEO', query: 'SEO' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    category: 'Lifestyle',
    children: [
      { label: 'Arts & Crafts', query: 'Arts' },
      { label: 'Food & Beverage', query: 'Cooking' },
      { label: 'Beauty & Makeup', query: 'Beauty' },
      { label: 'Travel', query: 'Travel' },
    ],
  },
  {
    id: 'photo',
    label: 'Photography & Video',
    category: 'Photography',
    children: [
      { label: 'Digital Photography', query: 'Photography' },
      { label: 'Video Design', query: 'Video' },
      { label: 'Commercial Photography', query: 'Commercial Photography' },
    ],
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    category: 'Health & Fitness',
    children: [
      { label: 'Fitness', query: 'Fitness' },
      { label: 'Nutrition', query: 'Nutrition' },
      { label: 'Yoga', query: 'Yoga' },
      { label: 'Mental Health', query: 'Mental Health' },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    category: 'Music',
    children: [
      { label: 'Instruments', query: 'Instrument' },
      { label: 'Music Production', query: 'Music Production' },
      { label: 'Music Fundamentals', query: 'Music Theory' },
      { label: 'Vocal', query: 'Vocal' },
    ],
  },
  {
    id: 'teaching',
    label: 'Teaching & Academics',
    category: 'Teaching & Academics',
    children: [
      { label: 'Engineering', query: 'Engineering' },
      { label: 'Math', query: 'Math' },
      { label: 'Science', query: 'Science' },
      { label: 'Language Learning', query: 'Language' },
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

/** Merge live catalog category names into the Explore list when they are not already covered. */
export function withCatalogCategories(catalogCategories = []) {
  const known = new Set(EXPLORE_CATEGORIES.map((item) => item.label.toLowerCase()));
  const extras = catalogCategories
    .filter(Boolean)
    .filter((name) => !known.has(String(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      id: `live-${name}`,
      label: name,
      category: name,
      children: [{ label: `All ${name}`, category: name }],
    }));
  return [...EXPLORE_CATEGORIES, ...extras];
}
