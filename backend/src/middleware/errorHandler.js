import { AppError } from '../lib/errors.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'The requested resource was not found.' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Request body must be valid JSON.' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
