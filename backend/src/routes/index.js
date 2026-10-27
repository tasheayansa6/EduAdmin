import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { login, logout, registerStudent, updateProfile } from '../services/authService.js';
import { getAdminNotifications, getDashboard } from '../services/dashboardService.js';
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from '../services/studentService.js';
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
import {
  createBlog,
  deleteBlog,
  getBlog,
  getPublishedBlogBySlug,
  listBlogs,
  listPublishedBlogs,
  updateBlog,
} from '../services/blogService.js';
import {
  createContactMessage,
  deleteContactMessage,
  getContactInfo,
  listContactMessages,
  updateContactInfo,
  updateContactMessageStatus,
} from '../services/contactService.js';
import {
  createMembershipRequest,
  deleteMembershipRequest,
  getMembershipSettings,
  listMembershipRequests,
  membershipRequestStats,
  updateMembershipRequest,
  updateMembershipSettings,
} from '../services/membershipService.js';
import { mailNotifyTo, sendEmail, verifyMailer } from '../lib/mailer.js';
import {
  deleteSubscription,
  listCampaigns,
  listSubscriptions,
  sendCampaign,
  setSubscriptionStatus,
  subscribe,
  subscriptionStats,
  unsubscribe,
} from '../services/subscriptionService.js';
import {
  applyToCareer,
  createCareer,
  deleteCareer,
  getCareer,
  getOpenCareerBySlug,
  listApplications,
  listCareers,
  listOpenCareers,
  updateApplicationStatus,
  updateCareer,
} from '../services/careerService.js';
import { getLookups } from '../services/lookupService.js';
import { getPublicExplore, getStudentHome } from '../services/studentPortalService.js';
import * as store from '../services/storeService.js';
import { assertLocalCourse } from '../services/storeService.js';
import { getLearning, getLocalLearning, setLessonCompleted, setLocalLessonCompleted } from '../services/learningService.js';
import * as account from '../services/studentAccountService.js';
import {
  adminCreateSchema,
  adminPatchSchema,
  blogCreateSchema,
  blogListSchema,
  blogPatchSchema,
  publishedBlogListSchema,
  contactInfoUpdateSchema,
  contactMessageCreateSchema,
  contactMessageListSchema,
  contactMessagePatchSchema,
  membershipUpdateSchema,
  membershipRequestCreateSchema,
  membershipRequestListSchema,
  membershipRequestPatchSchema,
  subscribeSchema,
  unsubscribeSchema,
  subscriptionListSchema,
  subscriptionStatusSchema,
  campaignSendSchema,
  campaignListSchema,
  careerListSchema,
  careerCreateSchema,
  careerPatchSchema,
  openCareerListSchema,
  careerApplySchema,
  careerApplicationListSchema,
  careerApplicationPatchSchema,
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
dashboardRouter.get('/notifications', asyncHandler(async (req, res) => {
  res.json({ data: await getAdminNotifications(req.query.limit) });
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
studentRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteStudent(req.user.id, req.valid.params.id);
  res.status(204).end();
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

const blogRouter = Router();
blogRouter.use(...adminOnly);
blogRouter.get('/', validate(blogListSchema), asyncHandler(async (req, res) => {
  res.json(await listBlogs(req.valid.query));
}));
blogRouter.post('/', validate(blogCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createBlog(req.user.id, req.valid.body) });
}));
blogRouter.get('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  res.json({ data: await getBlog(req.valid.params.id) });
}));
blogRouter.patch('/:id', validate(blogPatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateBlog(req.user.id, req.valid.params.id, req.valid.body) });
}));
blogRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteBlog(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const contactRouter = Router();
contactRouter.use(...adminOnly);
contactRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await getContactInfo() });
}));
contactRouter.put('/', validate(contactInfoUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateContactInfo(req.user.id, req.valid.body) });
}));
contactRouter.get('/messages', validate(contactMessageListSchema), asyncHandler(async (req, res) => {
  res.json(await listContactMessages(req.valid.query));
}));
contactRouter.patch('/messages/:id', validate(contactMessagePatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateContactMessageStatus(req.user.id, req.valid.params.id, req.valid.body.status) });
}));
contactRouter.delete('/messages/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteContactMessage(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const membershipRouter = Router();
membershipRouter.use(...adminOnly);
membershipRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ data: await getMembershipSettings() });
}));
membershipRouter.put('/', validate(membershipUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateMembershipSettings(req.user.id, req.valid.body) });
}));
membershipRouter.get('/requests/stats', asyncHandler(async (req, res) => {
  res.json({ data: await membershipRequestStats() });
}));
membershipRouter.get('/requests', validate(membershipRequestListSchema), asyncHandler(async (req, res) => {
  res.json(await listMembershipRequests(req.valid.query));
}));
membershipRouter.post('/requests', validate(membershipRequestCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({
    data: await createMembershipRequest(req.valid.body, {
      actorId: req.user.id,
      source: 'admin',
    }),
  });
}));
membershipRouter.patch('/requests/:id', validate(membershipRequestPatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateMembershipRequest(req.user.id, req.valid.params.id, req.valid.body) });
}));
membershipRouter.delete('/requests/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteMembershipRequest(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const subscriptionRouter = Router();
subscriptionRouter.use(...adminOnly);
subscriptionRouter.get('/stats', asyncHandler(async (req, res) => {
  res.json({ data: await subscriptionStats() });
}));
subscriptionRouter.get('/mail-status', asyncHandler(async (req, res) => {
  try {
    res.json({ data: await verifyMailer() });
  } catch (error) {
    res.json({
      data: {
        ok: false,
        configured: true,
        notifyTo: mailNotifyTo(),
        message: error.message || 'SMTP verification failed.',
      },
    });
  }
}));
subscriptionRouter.post('/mail-test', asyncHandler(async (req, res) => {
  const to = mailNotifyTo();
  const result = await sendEmail({
    to,
    subject: 'EduAdmin SMTP test',
    text: [
      'This is a test email from EduAdmin.',
      '',
      `Sent at: ${new Date().toISOString()}`,
      `Notify inbox: ${to}`,
      '',
      'If you received this, live SMTP is working.',
    ].join('\n'),
  });
  res.json({
    data: {
      ...result,
      notifyTo: to,
      message: result.mode === 'smtp'
        ? `Test email sent to ${to}.`
        : `SMTP not fully configured — test was logged only. Add SMTP_PASS (Gmail App Password) to backend/.env.`,
    },
  });
}));
subscriptionRouter.get('/campaigns', validate(campaignListSchema), asyncHandler(async (req, res) => {
  res.json(await listCampaigns(req.valid.query));
}));
subscriptionRouter.post('/campaigns', validate(campaignSendSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await sendCampaign(req.user.id, req.valid.body) });
}));
subscriptionRouter.get('/', validate(subscriptionListSchema), asyncHandler(async (req, res) => {
  res.json(await listSubscriptions(req.valid.query));
}));
subscriptionRouter.patch('/:id', validate(subscriptionStatusSchema), asyncHandler(async (req, res) => {
  res.json({ data: await setSubscriptionStatus(req.user.id, req.valid.params.id, req.valid.body.status) });
}));
subscriptionRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteSubscription(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const careerRouter = Router();
careerRouter.use(...adminOnly);
careerRouter.get('/', validate(careerListSchema), asyncHandler(async (req, res) => {
  res.json(await listCareers(req.valid.query));
}));
careerRouter.post('/', validate(careerCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createCareer(req.user.id, req.valid.body) });
}));
careerRouter.get('/applications', validate(careerApplicationListSchema), asyncHandler(async (req, res) => {
  res.json(await listApplications(req.valid.query));
}));
careerRouter.patch('/applications/:id', validate(careerApplicationPatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateApplicationStatus(req.user.id, req.valid.params.id, req.valid.body.status) });
}));
careerRouter.get('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  res.json({ data: await getCareer(req.valid.params.id) });
}));
careerRouter.patch('/:id', validate(careerPatchSchema), asyncHandler(async (req, res) => {
  res.json({ data: await updateCareer(req.user.id, req.valid.params.id, req.valid.body) });
}));
careerRouter.delete('/:id', validate(recordParams), asyncHandler(async (req, res) => {
  await deleteCareer(req.user.id, req.valid.params.id);
  res.status(204).end();
}));

const lookupRouter = Router();
lookupRouter.use(...adminOnly);

const portalRouter = Router();
portalRouter.use(authenticate, authorize('student'));
portalRouter.get('/home', asyncHandler(async (req, res) => {
  res.json({ data: await getStudentHome(req.user.id) });
}));
portalRouter.get('/blogs', validate(publishedBlogListSchema), asyncHandler(async (req, res) => {
  res.json(await listPublishedBlogs(req.valid.query));
}));
portalRouter.get('/blogs/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await getPublishedBlogBySlug(req.valid.params.slug) });
}));
portalRouter.get('/contact', asyncHandler(async (req, res) => {
  res.json({ data: await getContactInfo() });
}));
portalRouter.get('/membership', asyncHandler(async (req, res) => {
  res.json({ data: await getMembershipSettings() });
}));
portalRouter.post('/contact/messages', validate(contactMessageCreateSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await createContactMessage(req.user.id, req.valid.body) });
}));
portalRouter.post('/subscribe', validate(subscribeSchema), asyncHandler(async (req, res) => {
  res.status(201).json({
    data: await subscribe({
      email: req.valid.body.email,
      name: req.valid.body.name || req.user.name,
      source: 'student',
      userId: req.user.id,
    }),
  });
}));
portalRouter.get('/careers', validate(openCareerListSchema), asyncHandler(async (req, res) => {
  res.json(await listOpenCareers(req.valid.query));
}));
portalRouter.get('/careers/:slug', validate(slugParams), asyncHandler(async (req, res) => {
  res.json({ data: await getOpenCareerBySlug(req.valid.params.slug) });
}));
portalRouter.post('/careers/:slug/apply', validate(careerApplySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await applyToCareer(req.user.id, req.valid.params.slug, {
    name: req.valid.body.name,
    email: req.valid.body.email,
    phone: req.valid.body.phone,
    coverLetter: req.valid.body.coverLetter,
    resumeUrl: req.valid.body.resumeUrl,
  }) });
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
  const publicRouter = Router();
  publicRouter.get('/explore', asyncHandler(async (req, res) => {
    res.json({ data: await getPublicExplore() });
  }));
  publicRouter.get('/catalog', asyncHandler(async (req, res) => {
    res.json({ data: await store.getCatalog(null) });
  }));
  publicRouter.get('/catalog/:slug', validate(slugParams), asyncHandler(async (req, res) => {
    res.json({ data: await store.getCatalogDetail(null, req.valid.params.slug) });
  }));
  publicRouter.get('/contact', asyncHandler(async (req, res) => {
    res.json({ data: await getContactInfo() });
  }));
  publicRouter.get('/membership', asyncHandler(async (req, res) => {
    res.json({ data: await getMembershipSettings() });
  }));
  publicRouter.post('/membership/requests', validate(membershipRequestCreateSchema), asyncHandler(async (req, res) => {
    res.status(201).json({
      data: await createMembershipRequest(req.valid.body, { source: 'public' }),
    });
  }));
  publicRouter.post('/subscribe', validate(subscribeSchema), asyncHandler(async (req, res) => {
    res.status(201).json({
      data: await subscribe({
        email: req.valid.body.email,
        name: req.valid.body.name || null,
        source: 'public',
      }),
    });
  }));
  publicRouter.post('/unsubscribe', validate(unsubscribeSchema), asyncHandler(async (req, res) => {
    res.json({ data: await unsubscribe(req.valid.body.email) });
  }));

  v1.use('/auth', authRouter);
  v1.use('/public', publicRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/students', studentRouter);
  v1.use('/courses', courseRouter);
  v1.use('/enrollments', enrollmentRouter);
  v1.use('/progress', progressRouter);
  v1.use('/reports', reportRouter);
  v1.use('/administrators', adminRouter);
  v1.use('/blogs', blogRouter);
  v1.use('/contact', contactRouter);
  v1.use('/membership', membershipRouter);
  v1.use('/subscriptions', subscriptionRouter);
  v1.use('/careers', careerRouter);
  v1.use('/lookups', lookupRouter);
  v1.use('/student', portalRouter);
  v1.use('/payments', paymentRouter);
  app.use('/api/v1', v1);
}
