import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { login, logout, updateProfile } from '../services/authService.js';
import { getDashboard } from '../services/dashboardService.js';
import { getStudent, listStudents, updateStudent } from '../services/studentService.js';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../services/courseService.js';
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollment,
  listEnrollments,
  updateEnrollment,
} from '../services/enrollmentService.js';
import { listProgress } from '../services/progressService.js';
import { getReport, reportToCsv } from '../services/reportService.js';
import { createAdmin, listAdmins, updateAdminStatus } from '../services/adminService.js';
import { getLookups } from '../services/lookupService.js';
import {
  adminCreateSchema,
  adminPatchSchema,
  courseCreateSchema,
  courseListSchema,
  coursePatchSchema,
  enrollmentCreateSchema,
  enrollmentListSchema,
  enrollmentPatchSchema,
  loginSchema,
  profileSchema,
  progressListSchema,
  recordParams,
  reportSchema,
  studentListSchema,
  studentUpdateSchema,
} from '../validators/schemas.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const authRouter = Router();
authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  res.json(await login(req.valid.body.email, req.valid.body.password));
}));
authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
}));
authRouter.patch('/me', authenticate, validate(profileSchema), asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.valid.body.name);
  res.json({ user });
}));
authRouter.post('/logout', authenticate, asyncHandler(async (req, res) => {
  await logout(req.user.id);
  res.status(204).end();
}));

const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await getDashboard() });
}));

const studentRouter = Router();
studentRouter.use(authenticate);
studentRouter.get('/', validate(studentListSchema), asyncHandler(async (req, res) => {
  res.json(await listStudents(req.valid.query));
}));
studentRouter.get('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  res.json({ data: await getStudent(req.valid.params.id) });
}));
studentRouter.patch('/:id', validate(studentUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateStudent(req.user.id, req.valid.params.id, req.valid.body) });
}));

const courseRouter = Router();
courseRouter.use(authenticate);
courseRouter.get('/', validate(courseListSchema), asyncHandler(async (req, res) => {
  res.json(await listCourses(req.valid.query));
}));
courseRouter.post('/', validate(courseCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createCourse(req.user.id, req.valid.body) });
}));
courseRouter.patch('/:id', validate(coursePatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateCourse(req.user.id, req.valid.params.id, req.valid.body) });
}));
courseRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteCourse(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const enrollmentRouter = Router();
enrollmentRouter.use(authenticate);
enrollmentRouter.get('/', validate(enrollmentListSchema), asyncHandler(async (req, res) => {
  res.json(await listEnrollments(req.valid.query));
}));
enrollmentRouter.get('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  res.json({ data: await getEnrollment(req.valid.params.id) });
}));
enrollmentRouter.post('/', validate(enrollmentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createEnrollment(req.user.id, req.valid.body) });
}));
enrollmentRouter.patch('/:id', validate(enrollmentPatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateEnrollment(req.user.id, req.valid.params.id, req.valid.body.status) });
}));
enrollmentRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteEnrollment(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const progressRouter = Router();
progressRouter.use(authenticate);
progressRouter.get('/', validate(progressListSchema), asyncHandler(async (req, res) => {
  res.json(await listProgress(req.valid.query));
}));

const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.get('/', validate(reportSchema), asyncHandler(async (req, res) => {
  res.json({ data: await getReport(req.valid.query) });
}));
reportRouter.get('/export', validate(reportSchema), asyncHandler(async (req, res) => {
  const report = await getReport(req.valid.query);
  const csv = reportToCsv(report);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="eduadmin-course-report-${stamp}.csv"`);
  res.send(csv);
}));

const adminRouter = Router();
adminRouter.use(authenticate, authorize('super_admin'));
adminRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await listAdmins() });
}));
adminRouter.post('/', validate(adminCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createAdmin(req.user.id, req.valid.body) });
}));
adminRouter.patch('/:id', validate(adminPatchSchema), asyncHandler(async (req, res) => {
  await updateAdminStatus(req.user.id, req.valid.params.id, req.valid.body.status);
  res.json({ data: await listAdmins() });
}));

const lookupRouter = Router();
lookupRouter.use(authenticate);
lookupRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await getLookups() });
}));

export function registerRoutes(app) {
  const health = (req, res) => {
    res.json({ ok: true });
  };
  app.get('/api/health', health);
  app.get('/api/v1/health', health);

  const v1 = Router();
  v1.use('/auth', authRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/students', studentRouter);
  v1.use('/courses', courseRouter);
  v1.use('/enrollments', enrollmentRouter);
  v1.use('/progress', progressRouter);
  v1.use('/reports', reportRouter);
  v1.use('/administrators', adminRouter);
  v1.use('/lookups', lookupRouter);
  app.use('/api/v1', v1);
}
