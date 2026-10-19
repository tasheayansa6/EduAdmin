import { z } from 'zod';
import { AppError } from '../lib/errors.js';

export function validate(parts) {
  const schema = z.object({
    body: parts.body ?? z.any().optional(),
    query: parts.query ?? z.any().optional(),
    params: parts.params ?? z.any().optional(),
  });

  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join('.'),
        message: issue.message,
      }));
      next(new AppError(400, 'Please check the highlighted fields.', errors));
      return;
    }

    req.valid = result.data;
    next();
  };
}
