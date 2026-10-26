/**
 * AilgAgro-aligned livestock learning programs for EduAdmin.
 * Used by migrate to upsert catalog content (agri focus).
 */

export const LIVESTOCK_CATEGORY = [
  'Livestock',
  'Cattle fattening, feed, herd health, and market-day practice',
];

const cattleImage = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80';
const nutritionImage = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80&sat=-40';
const healthImage = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80';

export const AGRI_PROGRAMS = [
  {
    title: 'Cattle Fattening Fundamentals',
    subtitle: 'Member Program',
    description:
      'A structured program for members who want to run profitable cattle fattening operations with clarity. You will move from breed selection and feed planning to daily weight-gain tracking and market-day decisions, using plain language, practical tools, and materials you can reuse with your own team. Upon enrollment you receive one video lesson, two guided readings on this site, two PDF resources, and lifetime access to updates we publish for this program.',
    imageUrl: cattleImage,
    instructorName: 'AILG Livestock Desk',
    level: 'Livestock',
    language: 'English',
    price: 3000,
    currency: 'ETB',
    status: 'published',
    outcomes: [
      'Clear decisions on buy-in weight, ration costs, and target market days using simple scenarios and cash-flow thinking',
      'Stronger buyer and lender alignment by mapping who carries risk from shed to market, and how to communicate it',
      'Fattening practices you can reuse with templates written for real field conditions in Ethiopia',
      'Materials you keep with lifetime access to program updates',
    ],
    requirements: [
      'Cooperative leaders — board members and managers who approve livestock purchases and spending',
      'Feedlot & fattening operators — owners coordinating labor, feed, and buyers across the cycle',
      'Anyone preparing seasonal buy-in and market-day plans with a member base',
      'Teams that want one shared language for feed cost, weight gain, and risk',
      'Youth & field facilitators — graduates running or supporting small-scale fattening units',
      'People who train others and need concise, repeatable content',
    ],
    includes: [
      '1 video lesson',
      '2 guided readings',
      '2 PDF downloads',
      'Lifetime access to updates',
    ],
    outline: [
      {
        title: 'Breed selection & shed setup',
        lessons: [
          {
            title: 'Introduction to cattle fattening business planning',
            type: 'video',
            durationMinutes: 18,
            videoUrl: 'https://youtu.be/_LA9QsgJ0bw',
            isPreview: true,
          },
        ],
      },
      {
        title: 'Feed planning & ration costs',
        lessons: [
          {
            title: 'Reading: syndicate roles & meeting rhythm',
            type: 'article',
            isPreview: false,
            content:
              'Cooperatives and fattening syndicates work best when roles, meeting rhythms, and decision rules are written in one place. Start with a simple calendar: monthly finance review, quarterly planning, and an annual assembly.',
          },
        ],
      },
      {
        title: 'Health, weight tracking & market days',
        lessons: [
          {
            title: 'Reading: buyers, lenders & risk scenarios',
            type: 'article',
            isPreview: false,
            content:
              'For a cattle fattening operation, map who benefits, who contributes labor or capital, who can block a decision, and who carries market or regulatory risk.',
          },
          {
            title: 'Course workbook — modules & worksheets',
            type: 'pdf',
            isPreview: false,
          },
          {
            title: 'Reference: fattening cycle cash-flow example (filled)',
            type: 'pdf',
            isPreview: false,
          },
        ],
      },
    ],
  },
  {
    title: 'Cattle Nutrition & Feed Formulation',
    subtitle: 'Coming Soon',
    description:
      'Ration design with locally available feedstuffs and cost-per-kilo-of-gain calculations you can run with your feeding team.',
    imageUrl: nutritionImage,
    instructorName: 'AILG Livestock Desk',
    level: 'Livestock',
    language: 'English',
    price: 0,
    currency: 'ETB',
    status: 'coming_soon',
    outcomes: [],
    requirements: [],
    includes: ['4 modules planned', 'Coming soon'],
    outline: [
      { title: 'Local feedstuffs inventory', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
      { title: 'Ration design basics', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
      { title: 'Cost per kilo of gain', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
      { title: 'Feeding team worksheets', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
    ],
  },
  {
    title: 'Livestock Health & Breeding Basics',
    subtitle: 'Coming Soon',
    description:
      'Vaccination schedules, common disease signs, and breeding selection practices for healthier, higher-yield herds.',
    imageUrl: healthImage,
    instructorName: 'AILG Livestock Desk',
    level: 'Livestock',
    language: 'English',
    price: 0,
    currency: 'ETB',
    status: 'coming_soon',
    outcomes: [],
    requirements: [],
    includes: ['3 modules planned', 'Coming soon'],
    outline: [
      { title: 'Vaccination schedules', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
      { title: 'Common disease signs', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
      { title: 'Breeding selection practices', lessons: [{ title: 'Overview', type: 'article', isPreview: false }] },
    ],
  },
];
