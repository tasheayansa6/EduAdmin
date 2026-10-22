import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address.').max(255);
const personName = z.string().trim().min(2, 'Enter at least 2 characters.').max(120);
const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use at most 72 characters.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.');

const search = z.string().trim().max(120).optional().default('');
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(50).default(10);

const optionalDate = z
  .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.')])
  .optional()
  .default('');

const optionalId = z
  .string()
  .optional()
  .default('')
  .transform((value, ctx) => {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose a valid record.' });
      return z.NEVER;
    }
    return parsed;
  });

export const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const loginSchema = {
  body: z.object({
    email,
    password: z.string().min(1, 'Enter your password.').max(72),
  }),
};

export const registerSchema = {
  body: z.object({
    name: personName,
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  }).superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }
  }),
};

export const profileSchema = {
  body: z.object({ name: personName }),
};

export const studentListSchema = {
  query: z.object({
    q: search,
    page,
    limit,
    status: z.enum(['', 'active', 'inactive', 'suspended']).optional().default(''),
  }),
};

export const studentCreateSchema = {
  body: z.object({
    name: personName,
    email,
    password,
  }),
};

export const studentUpdateSchema = {
  params: idParam,
  body: z.object({
    name: personName,
    email,
    status: z.enum(['active', 'inactive', 'suspended']),
  }),
};

export const courseListSchema = {
  query: z.object({
    q: search,
    page,
    limit,
    status: z.enum(['', 'draft', 'published']).optional().default(''),
    categoryId: optionalId,
  }),
};

const coursePrice = z.coerce.number().min(0, 'Price cannot be negative.').max(1_000_000, 'Enter a lower price.');
const courseCurrency = z.string().trim().toUpperCase().length(3, 'Use a 3-letter currency code.').default('ETB');
function normalizeOptionalUrl(value) {
  if (value == null || String(value).trim() === '') return null;
  let url = String(value).trim().slice(0, 500);
  if (/^\/\//.test(url)) url = `https:${url}`;
  else if (!/^https?:\/\//i.test(url)
    && /^(www\.|youtu\.be\/|m\.youtube\.com\/|music\.youtube\.com\/|youtube\.com\/|youtube-nocookie\.com\/|vimeo\.com\/|player\.vimeo\.com\/)/i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

const optionalUrl = z.preprocess(
  normalizeOptionalUrl,
  z.string().url('Enter a full web address starting with http:// or https://.').max(500).nullable(),
);
const optionalText = (max) => z.preprocess(
  (value) => (value == null || String(value).trim() === '' ? null : String(value).trim()),
  z.string().max(max).nullable(),
);
const stringList = z.array(z.string().trim().min(1).max(240)).max(40).optional().default([]);
const outlineSchema = z.array(z.object({
  id: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1).max(160),
  lessons: z.array(z.object({
    id: z.number().int().positive().nullable().optional(),
    title: z.string().trim().min(1).max(180),
    durationMinutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
    type: z.enum(['video', 'pdf', 'article', 'lesson']).optional().default('article'),
    videoUrl: optionalUrl.optional(),
    pdfUrl: optionalUrl.optional(),
    content: z.preprocess(
      (value) => (value == null || String(value).trim() === '' ? null : String(value).trim()),
      z.string().max(20000).nullable(),
    ).optional(),
    isPreview: z.boolean().optional().default(false),
  })).max(80).default([]),
})).max(40).optional().default([]);

const courseDetails = {
  subtitle: optionalText(255).optional(),
  imageUrl: optionalUrl.optional(),
  previewVideoUrl: optionalUrl.optional(),
  instructorName: optionalText(120).optional(),
  level: z.preprocess(
    (value) => (value == null || String(value).trim() === '' ? null : String(value).trim()),
    z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
  ).optional(),
  language: z.string().trim().min(2).max(40).optional().default('English'),
  totalMinutes: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
  outcomes: stringList,
  requirements: stringList,
  includes: stringList,
  outline: outlineSchema,
};

export const courseCreateSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Enter a title of at least 3 characters.').max(180),
    description: z.string().trim().min(10, 'Enter a description of at least 10 characters.').max(4000),
    categoryId: z.number().int().positive('Choose a category.'),
    status: z.enum(['draft', 'published']),
    price: coursePrice.default(0),
    currency: courseCurrency,
    ...courseDetails,
  }),
};

export const coursePatchSchema = {
  params: idParam,
  body: z
    .object({
      title: z.string().trim().min(3).max(180).optional(),
      description: z.string().trim().min(10).max(4000).optional(),
      categoryId: z.number().int().positive().optional(),
      status: z.enum(['draft', 'published']).optional(),
      price: coursePrice.optional(),
      currency: courseCurrency.optional(),
      subtitle: optionalText(255).optional(),
      imageUrl: optionalUrl.optional(),
      previewVideoUrl: optionalUrl.optional(),
      instructorName: optionalText(120).optional(),
      level: z.preprocess(
        (value) => (value == null || String(value).trim() === '' ? null : String(value).trim()),
        z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
      ).optional(),
      language: z.string().trim().min(2).max(40).optional(),
      totalMinutes: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
      outcomes: z.array(z.string().trim().min(1).max(240)).max(40).optional(),
      requirements: z.array(z.string().trim().min(1).max(240)).max(40).optional(),
      includes: z.array(z.string().trim().min(1).max(240)).max(40).optional(),
      outline: outlineSchema.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to update.' }),
};

export const enrollmentListSchema = {
  query: z.object({
    q: search,
    page,
    limit,
    status: z.enum(['', 'active', 'completed', 'withdrawn']).optional().default(''),
    courseId: optionalId,
  }),
};

export const enrollmentCreateSchema = {
  body: z.object({
    userId: z.number().int().positive('Choose a student.'),
    courseId: z.number().int().positive('Choose a course.'),
  }),
};

export const studentEnrollSchema = {
  body: z.object({
    courseId: z.number().int().positive('Choose a course.'),
  }),
};

export const enrollmentPatchSchema = {
  params: idParam,
  body: z.object({
    status: z.enum(['active', 'completed', 'withdrawn']),
  }),
};

export const progressListSchema = {
  query: z.object({
    q: search,
    page,
    limit,
    status: z.enum(['', 'not_started', 'in_progress', 'completed']).optional().default(''),
    courseId: optionalId,
  }),
};

export const reportSchema = {
  query: z.object({
    from: optionalDate,
    to: optionalDate,
    courseId: optionalId,
  }),
};

export const adminCreateSchema = {
  body: z.object({
    name: personName,
    email,
    password,
  }),
};

export const adminPatchSchema = {
  params: idParam,
  body: z.object({
    status: z.enum(['active', 'inactive']),
  }),
};

export const recordParams = {
  params: idParam,
};

const courseSlug = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/, 'Choose a valid course.');

export const slugParams = {
  params: z.object({ slug: courseSlug }),
};

export const slugBody = {
  body: z.object({ slug: courseSlug }),
};

/** Exactly one of slug (AILG store) or courseId (EduAdmin course). */
export const savedItemBody = {
  body: z.object({
    slug: courseSlug.optional(),
    courseId: z.number().int().positive().optional(),
  }).refine((body) => Boolean(body.slug) !== Boolean(body.courseId), {
    message: 'Choose a course by slug or by id.',
  }),
};

export const localCourseParams = {
  params: z.object({ courseId: z.coerce.number().int().positive() }),
};

export const checkoutSchema = {
  body: z.object({
    slugs: z.array(courseSlug).max(20).optional().default([]),
    courseIds: z.array(z.number().int().positive()).max(20).optional().default([]),
  }).refine((body) => body.slugs.length + body.courseIds.length >= 1, {
    message: 'Choose at least one course.',
  }).refine((body) => body.slugs.length + body.courseIds.length <= 20, {
    message: 'Choose at most 20 courses.',
  }),
};

export const PROFILE_LANGUAGES = ['en', 'am', 'om', 'ti', 'so', 'ar', 'fr'];

const blankToNull = (schema) => z.preprocess((value) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}, schema.nullable());

const username = (label) => blankToNull(
  z.string().max(100).regex(/^[A-Za-z0-9._-]+$/, `Enter only your ${label} username, without the web address.`),
);

export const studentProfileSchema = {
  body: z.object({
    firstName: z.string().trim().min(1, 'Enter your first name.').max(60, 'Use at most 60 characters.'),
    lastName: z.string().trim().max(60, 'Use at most 60 characters.').default(''),
    headline: blankToNull(z.string().max(60, 'Use at most 60 characters.')),
    biography: blankToNull(
      z.string()
        .max(2000, 'Use at most 2000 characters.')
        .refine((text) => !/(https?:\/\/|www\.)/i.test(text), 'Links are not permitted in your biography.'),
    ),
    language: z.enum(PROFILE_LANGUAGES, { errorMap: () => ({ message: 'Choose a language from the list.' }) }),
    website: blankToNull(
      z.string().max(255).url('Enter a full web address starting with http:// or https://.')
        .refine((url) => /^https?:\/\//i.test(url), 'Enter a full web address starting with http:// or https://.'),
    ),
    facebook: username('Facebook'),
    instagram: username('Instagram'),
    linkedin: blankToNull(
      z.string().max(150).regex(/^(in|company|school)\/[A-Za-z0-9._%-]+\/?$/, 'Use the part after linkedin.com/, for example in/johnsmith.'),
    ),
    tiktok: blankToNull(z.string().max(100).transform((value) => value.replace(/^@/, '')).pipe(
      z.string().regex(/^[A-Za-z0-9._-]+$/, 'Enter only your TikTok username, without the web address.'),
    )),
    x: username('X'),
    youtube: username('YouTube'),
  }).refine((body) => `${body.firstName} ${body.lastName}`.trim().length >= 2, {
    path: ['firstName'],
    message: 'Enter at least 2 characters for your name.',
  }),
};

export const passwordChangeSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(72),
    newPassword: password,
  }).refine((body) => body.currentPassword !== body.newPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one.',
  }),
};

export const notificationListSchema = {
  query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }),
};

export const notificationReadSchema = {
  body: z.object({ ids: z.array(z.number().int().positive()).max(100).optional() }),
};

export const lessonCompletionSchema = {
  params: z.object({ slug: courseSlug, lessonId: z.coerce.number().int().positive() }),
  body: z.object({ completed: z.boolean() }),
};

export const localLessonCompletionSchema = {
  params: z.object({
    courseId: z.coerce.number().int().positive(),
    lessonId: z.coerce.number().int().positive(),
  }),
  body: z.object({ completed: z.boolean() }),
};

export const orderParams = {
  params: z.object({ txRef: z.string().regex(/^eduadmin-[0-9a-f-]{36}$/, 'Payment not found.') }),
};
