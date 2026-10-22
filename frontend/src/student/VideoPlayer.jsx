/** Turns common YouTube / Vimeo share links into an embeddable player URL. */
function embedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\.|^music\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = parsed.searchParams.get('v')
        || parsed.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1];
      if (!id) return null;
      const start = parsed.searchParams.get('t') || parsed.searchParams.get('start');
      const seconds = start ? String(start).replace(/s$/i, '') : '';
      const query = seconds && /^\d+$/.test(seconds) ? `?start=${seconds}` : '';
      return `https://www.youtube.com/embed/${encodeURIComponent(id)}${query}`;
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.match(/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function looksLikeVideoFile(url) {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url);
}

function OpenVideoFallback({ url, title, reason }) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 bg-charcoal px-6 py-10 text-center text-white">
      <p className="text-sm font-semibold">{title || 'Video lesson'}</p>
      <p className="max-w-md text-sm text-white/75">{reason}</p>
      <a href={url} target="_blank" rel="noreferrer" className="btn-brand bg-wheat text-charcoal hover:bg-wheat-hover">
        Open video
      </a>
    </div>
  );
}

export function VideoPlayer({ url, title, onEnded }) {
  if (!url) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center bg-charcoal px-6 text-sm text-white/80">
        No video link was saved for this lesson.
      </div>
    );
  }

  const embed = embedUrl(url);
  if (embed) {
    return (
      <iframe
        key={embed}
        src={embed}
        title={title || 'Video lesson'}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (looksLikeVideoFile(url)) {
    return (
      <video key={url} src={url} controls preload="metadata" className="h-full w-full bg-black" onEnded={onEnded}>
        <a href={url} target="_blank" rel="noreferrer">Open the video</a>
      </video>
    );
  }

  return (
    <OpenVideoFallback
      url={url}
      title={title}
      reason="This link is not a YouTube, Vimeo, or direct video file. Open it in a new tab to watch."
    />
  );
}
