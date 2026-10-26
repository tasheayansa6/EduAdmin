import { Link, useParams } from 'react-router-dom';
import { api, buildQuery } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { formatDate } from '../lib/format.js';
import { StudentData, StudentEmpty } from '../student/components.jsx';
import { useDocumentTitle } from '../student/StudentData.jsx';

function paragraphs(body) {
  return String(body || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function StudentBlogsPage() {
  useDocumentTitle('Blog');
  const resource = useResource(
    () => api(`/api/v1/student/blogs${buildQuery({ page: 1, limit: 24 })}`),
    [],
  );
  const rows = resource.data?.data ?? [];

  return (
    <StudentData resource={resource} label="Loading blog posts">
      {() => (
        <div className="space-y-6">
          <header className="hub-card p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">From the team</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-charcoal sm:text-3xl">Blog</h1>
            <p className="mt-1 text-sm text-charcoal-muted">Articles published by administrators.</p>
          </header>

          {!rows.length ? (
            <StudentEmpty
              title="No posts yet"
              message="When an administrator publishes a blog, it will show up here."
              action={<Link to="/learn" className="btn-brand">Back to Explore</Link>}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rows.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/learn/blogs/${encodeURIComponent(post.slug)}`}
                    className="hub-card block h-full overflow-hidden transition hover:shadow-lift"
                  >
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : null}
                    <div className="p-4 sm:p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">
                        {post.publishedAt ? formatDate(post.publishedAt) : 'Published'}
                        {post.authorName ? ` · ${post.authorName}` : ''}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold text-charcoal">{post.title}</h2>
                      {post.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal-muted">{post.excerpt}</p>
                      ) : null}
                      <span className="mt-3 inline-flex text-sm font-bold text-brand">Read article</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </StudentData>
  );
}

export function StudentBlogDetailPage() {
  const { slug } = useParams();
  const resource = useResource(
    () => api(`/api/v1/student/blogs/${encodeURIComponent(slug)}`),
    [slug],
  );
  const post = resource.data?.data;
  useDocumentTitle(post?.title || 'Blog');

  return (
    <StudentData resource={resource} label="Loading article">
      {() => {
        if (!post) {
          return (
            <StudentEmpty
              title="Post not found"
              message="This article is unavailable or still a draft."
              action={<Link to="/learn/blogs" className="btn-brand">All posts</Link>}
            />
          );
        }
        const blocks = paragraphs(post.body);
        return (
          <article className="mx-auto max-w-3xl space-y-5">
            <Link to="/learn/blogs" className="text-sm font-bold text-brand hover:underline">
              ← All posts
            </Link>
            <header className="hub-card overflow-hidden">
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt="" className="max-h-80 w-full object-cover" />
              ) : null}
              <div className="p-5 sm:p-7">
                <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">
                  {post.publishedAt ? formatDate(post.publishedAt) : 'Published'}
                  {post.authorName ? ` · ${post.authorName}` : ''}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
                  {post.title}
                </h1>
                {post.excerpt ? (
                  <p className="mt-3 text-base leading-relaxed text-charcoal-muted">{post.excerpt}</p>
                ) : null}
              </div>
            </header>
            <div className="hub-card space-y-4 p-5 sm:p-7">
              {blocks.map((block) => (
                <p key={block.slice(0, 48)} className="whitespace-pre-wrap text-base leading-relaxed text-charcoal">
                  {block}
                </p>
              ))}
            </div>
          </article>
        );
      }}
    </StudentData>
  );
}
