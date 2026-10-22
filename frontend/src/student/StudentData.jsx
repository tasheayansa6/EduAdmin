import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';

const StudentDataContext = createContext(null);

export function StudentDataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const result = await api('/api/v1/student/home');
      setState({ status: 'ready', data: result.data, error: null });
      return true;
    } catch (error) {
      setState((current) => (quiet && current.data ? current : { status: 'error', data: null, error }));
      return false;
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load({ quiet: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const enroll = useCallback(async (courseId) => {
    await api('/api/v1/student/enrollments', { method: 'POST', body: { courseId } });
    await load({ quiet: true });
  }, [load]);

  const value = useMemo(() => ({
    ...state,
    reload: () => load(),
    refresh: () => load({ quiet: true }),
    enroll,
  }), [state, load, enroll]);

  return (
    <StudentDataContext.Provider value={value}>
      <StoreProvider onEnrolled={value.refresh}>{children}</StoreProvider>
    </StudentDataContext.Provider>
  );
}

const StoreContext = createContext(null);
const EMPTY_CART = { items: [], total: 0, currency: null, mixedCurrencies: false, paymentsEnabled: false };

/** AilgAdmin catalog plus this student's cart and favorites. Loads apart from home data so a catalog outage does not hide My learning. */
function StoreProvider({ onEnrolled, children }) {
  const [catalog, setCatalog] = useState({ status: 'loading', data: null, error: null });
  const [cart, setCart] = useState(EMPTY_CART);
  const [favorites, setFavorites] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);

  const loadCatalog = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setCatalog((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const result = await api('/api/v1/student/catalog');
      setCatalog({ status: 'ready', data: Array.isArray(result.data) ? result.data : [], error: null });
    } catch {
      // External store may be offline; EduAdmin courses still come from /student/home.
      setCatalog((current) => (quiet && current.data
        ? current
        : { status: 'ready', data: [], error: null }));
    }
  }, []);

  const loadSaved = useCallback(async () => {
    const [cartResult, favoriteResult] = await Promise.allSettled([api('/api/v1/student/cart'), api('/api/v1/student/favorites')]);
    if (cartResult.status === 'fulfilled') setCart(cartResult.value.data);
    if (favoriteResult.status === 'fulfilled') setFavorites(favoriteResult.value.data);
    setSavedLoaded(true);
  }, []);

  useEffect(() => {
    loadCatalog();
    loadSaved();
    const onFocus = () => loadCatalog({ quiet: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadCatalog, loadSaved]);

  const patchCourse = useCallback((ref, patch) => {
    setCatalog((current) => (current.data
      ? {
        ...current,
        data: current.data.map((course) => {
          if (ref.slug && course.slug === ref.slug) return { ...course, ...patch };
          if (ref.courseId && course.courseId === ref.courseId) return { ...course, ...patch };
          return course;
        }),
      }
      : current));
  }, []);

  /** `course` may be a store course (slug) or an EduAdmin course (id / courseId). */
  const courseRef = (course) => (course.local || !course.slug
    ? { courseId: course.id ?? course.courseId }
    : { slug: course.slug });

  const setFavorite = useCallback(async (course, on) => {
    const ref = courseRef(course);
    const result = on
      ? await api('/api/v1/student/favorites', { method: 'POST', body: ref })
      : await api(ref.slug ? `/api/v1/student/favorites/${ref.slug}` : `/api/v1/student/favorites/local/${ref.courseId}`, { method: 'DELETE' });
    setFavorites(result.data);
    patchCourse(ref, { favorite: on });
    await onEnrolled();
  }, [patchCourse, onEnrolled]);

  const setInCart = useCallback(async (course, on) => {
    const ref = courseRef(course);
    const result = on
      ? await api('/api/v1/student/cart', { method: 'POST', body: ref })
      : await api(ref.slug ? `/api/v1/student/cart/${ref.slug}` : `/api/v1/student/cart/local/${ref.courseId}`, { method: 'DELETE' });
    setCart(result.data);
    patchCourse(ref, { inCart: on });
    await onEnrolled();
  }, [patchCourse, onEnrolled]);

  /** Re-reads everything after enrollment changes (free enroll or a confirmed payment). */
  const afterEnrollment = useCallback(async () => {
    await Promise.all([loadCatalog({ quiet: true }), loadSaved(), onEnrolled()]);
  }, [loadCatalog, loadSaved, onEnrolled]);

  const enrollFree = useCallback(async (slug) => {
    const result = await api(`/api/v1/student/catalog/${slug}/enroll`, { method: 'POST' });
    await afterEnrollment();
    return result.data;
  }, [afterEnrollment]);

  /** Starts a Chapa checkout and leaves the app for Chapa's hosted payment page. */
  const checkout = useCallback(async (items) => {
    const slugs = [];
    const courseIds = [];
    for (const item of items) {
      if (item.local || item.courseId && !item.slug) courseIds.push(item.courseId ?? item.id);
      else if (item.slug) slugs.push(item.slug);
      else if (typeof item === 'string') slugs.push(item);
    }
    const result = await api('/api/v1/student/checkout', { method: 'POST', body: { slugs, courseIds } });
    window.location.assign(result.data.checkoutUrl);
  }, []);

  const value = useMemo(() => ({
    catalog: { ...catalog, reload: () => loadCatalog(), refresh: () => loadCatalog({ quiet: true }) },
    cart,
    favorites,
    savedLoaded,
    setFavorite,
    setInCart,
    enrollFree,
    checkout,
    afterEnrollment,
  }), [catalog, cart, favorites, savedLoaded, loadCatalog, setFavorite, setInCart, enrollFree, checkout, afterEnrollment]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StudentDataProvider');
  return context;
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (!context) throw new Error('useStudentData must be used within StudentDataProvider');
  return context;
}

/** EduAdmin courses open by id and share the catalog card shape with a `local` flag. */
function fromLocalCourse(course) {
  const enrolled = course.enrollmentStatus && course.enrollmentStatus !== 'withdrawn';
  return {
    key: `local-${course.id}`,
    local: true,
    id: course.id,
    courseId: course.id,
    slug: null,
    title: course.title,
    subtitle: course.subtitle || course.description,
    description: course.description,
    imageUrl: course.imageUrl || null,
    category: course.categoryName,
    instructorName: course.instructorName || null,
    level: course.level || null,
    lessonCount: (course.sections || []).reduce((sum, section) => sum + (section.lessons?.length || 0), 0) || null,
    totalMinutes: course.totalMinutes ?? null,
    isFree: Boolean(course.isFree ?? Number(course.price) <= 0),
    price: Number(course.price) || 0,
    currency: course.currency || 'ETB',
    favorite: Boolean(course.favorite),
    inCart: Boolean(course.inCart),
    publishedAt: course.createdAt,
    enrollment: enrolled ? { status: course.enrollmentStatus, percent: course.percent } : null,
  };
}

/**
 * Every published course a student can join: the ones administrators add in EduAdmin
 * plus the AILG Academy store. Either source can fail without hiding the other.
 */
export function useAllCourses() {
  const home = useStudentData();
  const { catalog } = useStore();
  const reloaders = useRef({ home: home.refresh, store: catalog.refresh });

  useEffect(() => {
    reloaders.current.home();
    reloaders.current.store();
  }, []);

  const local = (home.data?.catalog ?? []).map(fromLocalCourse);
  const store = (catalog.data ?? []).map((course) => ({ ...course, key: course.slug }));
  const loading = (home.status === 'loading' && !home.data) || (catalog.status === 'loading' && catalog.data == null);
  return {
    courses: [...local, ...store],
    loading,
    storeError: null,
    reloadStore: catalog.reload,
  };
}

/** Joins the published catalog with this student's enrollment rows, keyed by course id. */
export function courseIndex(data) {
  const byId = new Map();
  for (const course of data?.catalog ?? []) {
    byId.set(course.id, { ...course, published: true, enrollment: null });
  }
  for (const row of data?.enrollments ?? []) {
    const existing = byId.get(row.courseId);
    if (existing) {
      existing.enrollment = row;
    } else {
      byId.set(row.courseId, {
        id: row.courseId,
        title: row.courseTitle,
        description: row.courseDescription,
        categoryName: row.categoryName,
        published: false,
        enrollment: row,
      });
    }
  }
  return byId;
}

export function currentEnrollments(data) {
  return (data?.enrollments ?? []).filter((row) => row.status !== 'withdrawn');
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · EduAdmin` : 'EduAdmin';
  }, [title]);
}
