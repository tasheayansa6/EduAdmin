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

export const courseCreateSchema = {
  body: z.object({
    title: z.string().trim().min(3, 'Enter a title of at least 3 characters.').max(180),
    description: z.string().trim().min(10, 'Enter a description of at least 10 characters.').max(4000),
    categoryId: z.number().int().positive('Choose a category.'),
    status: z.enum(['draft', 'published']),
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
