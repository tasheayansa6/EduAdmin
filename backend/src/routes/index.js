import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { login, logout, registerStudent, updateProfile } from '../services/authService.js';
import { getDashboard } from '../services/dashboardService.js';
import { createStudent, getStudent, listStudents, updateStudent } from '../services/studentService.js';
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
import { getStudentHome } from '../services/studentPortalService.js';
import * as store from '../services/storeService.js';
import { assertLocalCourse } from '../services/storeService.js';
import { getLearning, getLocalLearning, setLessonCompleted, setLocalLessonCompleted } from '../services/learningService.js';
import * as account from '../services/studentAccountService.js';
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
  registerSchema,
  progressListSchema,
  recordParams,
  reportSchema,
  checkoutSchema,
  orderParams,
  lessonCompletionSchema,
  notificationListSchema,
  notificationReadSchema,
  passwordChangeSchema,
  studentProfileSchema,
  slugBody,
  savedItemBody,
  localCourseParams,
  slugParams,
  localLessonCompletionSchema,
  studentCreateSchema,
  studentEnrollSchema,
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

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment attempts. Try again in a few minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const authRouter = Router();
authRouter.post('/register', registerLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.valid.body;
  res.status(201).json(await registerStudent({ name, email, password }));
}));
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

const adminOnly = [authenticate, authorize('admin', 'super_admin')];

const dashboardRouter = Router();
dashboardRouter.use(...adminOnly);
dashboardRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await getDashboard() });
}));

const studentRouter = Router();
studentRouter.use(...adminOnly);
studentRouter.get('/', validate(studentListSchema), asyncHandler(async (req, res) => {
  res.json(await listStudents(req.valid.query));
}));
studentRouter.post('/', validate(studentCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createStudent(req.user.id, req.valid.body) });
}));
studentRouter.get('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  res.json({ data: await getStudent(req.valid.params.id) });
}));
studentRouter.patch('/:id', validate(studentUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateStudent(req.user.id, req.valid.params.id, req.valid.body) });
}));

const courseRouter = Router();
courseRouter.use(...adminOnly);
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
enrollmentRouter.use(...adminOnly);
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
progressRouter.use(...adminOnly);
progressRouter.get('/', validate(progressListSchema), asyncHandler(async (req, res) => {
  res.json(await listProgress(req.valid.query));
}));

const reportRouter = Router();
reportRouter.use(...adminOnly);
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
lookupRouter.use(...adminOnly);

const portalRouter = Router();
portalRouter.use(authenticate, authorize('student'));
portalRouter.get('/home', asyncHandler(async (req, res) => {
  res.json({ data: await getStudentHome(req.user.id) });
}));
portalRouter.post('/enrollments', validate(studentEnrollSchema), asyncHandler(async (req, res) => {
  await assertLocalCourse(req.valid.body.courseId);
  const enrollment = await createEnrollment(req.user.id, {
    userId: req.user.id,
    courseId: req.valid.body.courseId,
  });
  res.status(201).json({ data: enrollment });
}));
portalRouter.get('/catalog', asyncHandler(async (req, res) => {
  res.json({ data: await store.getCatalog(req.user.id) });
}));
portalRouter.get('/catalog/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.getCatalogDetail(req.user.id, req.valid.params.slug) });
}));
portalRouter.post('/catalog/:slug/enroll', validate(slugParams), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await store.enrollFree(req.user, req.valid.params.slug) });
}));
portalRouter.get('/cart', asyncHandler(async (req, res) => {
  res.json({ data: await store.getCart(req.user.id) });
}));
portalRouter.post('/cart', validate(savedItemBody), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await store.addToCart(req.user.id, req.valid.body) });
}));
portalRouter.delete('/cart/local/:courseId', validate(localCourseParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.removeFromCart(req.user.id, { courseId: req.valid.params.courseId }) });
}));
portalRouter.delete('/cart/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.removeFromCart(req.user.id, { slug: req.valid.params.slug }) });
}));
portalRouter.get('/favorites', asyncHandler(async (req, res) => {
  res.json({ data: await store.getFavorites(req.user.id) });
}));
portalRouter.post('/favorites', validate(savedItemBody), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await store.addFavorite(req.user.id, req.valid.body) });
}));
portalRouter.delete('/favorites/local/:courseId', validate(localCourseParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.removeFavorite(req.user.id, { courseId: req.valid.params.courseId }) });
}));
portalRouter.delete('/favorites/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.removeFavorite(req.user.id, { slug: req.valid.params.slug }) });
}));
portalRouter.post('/checkout', checkoutLimiter, validate(checkoutSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await store.startCheckout(req.user, req.valid.body) });
}));
portalRouter.get('/profile', asyncHandler(async (req, res) => {
  res.json({ data: await account.getStudentProfile(req.user.id) });
}));
portalRouter.put('/profile', validate(studentProfileSchema), asyncHandler(async (req, res) => {
  res.json({ data: await account.updateStudentProfile(req.user.id, req.valid.body) });
}));
portalRouter.post('/password', loginLimiter, validate(passwordChangeSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.valid.body;
  res.json({ data: await account.changePassword(req.user.id, currentPassword, newPassword) });
}));
portalRouter.get('/notifications', validate(notificationListSchema), asyncHandler(async (req, res) => {
  res.json({ data: await account.listNotifications(req.user.id, req.valid.query.limit) });
}));
portalRouter.post('/notifications/read', validate(notificationReadSchema), asyncHandler(async (req, res) => {
  res.json({ data: await account.markNotificationsRead(req.user.id, req.valid.body.ids) });
}));
portalRouter.get('/learn/local/:courseId', validate(localCourseParams), asyncHandler(async (req, res) => {
  res.json({ data: await getLocalLearning(req.user.id, req.valid.params.courseId) });
}));
portalRouter.put('/learn/local/:courseId/lessons/:lessonId', validate(localLessonCompletionSchema), asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.valid.params;
  res.json({ data: await setLocalLessonCompleted(req.user.id, courseId, lessonId, req.valid.body.completed) });
}));
portalRouter.get('/learn/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await getLearning(req.user.id, req.valid.params.slug) });
}));
portalRouter.put('/learn/:slug/lessons/:lessonId', validate(lessonCompletionSchema), asyncHandler(async (req, res) => {
  const { slug, lessonId } = req.valid.params;
  res.json({ data: await setLessonCompleted(req.user.id, slug, lessonId, req.valid.body.completed) });
}));
portalRouter.post('/orders/:txRef/confirm', validate(orderParams), asyncHandler(async (req, res) => {
  res.json({ data: await store.confirmOrder(req.valid.params.txRef, req.user.id) });
}));

/** Chapa calls this after payment. The order is only marked paid after re-verifying with Chapa. */
const paymentRouter = Router();
paymentRouter.all('/chapa/callback', asyncHandler(async (req, res) => {
  const txRef = String(req.query.trx_ref || req.query.tx_ref || req.body?.trx_ref || req.body?.tx_ref || '');
  if (!/^eduadmin-[0-9a-f-]{36}$/.test(txRef)) {
    res.status(400).json({ message: 'Unknown payment reference.' });
    return;
  }
  const order = await store.confirmOrder(txRef);
  res.json({ status: order.status });
}));

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
  v1.use('/student', portalRouter);
  v1.use('/payments', paymentRouter);
  app.use('/api/v1', v1);
}
