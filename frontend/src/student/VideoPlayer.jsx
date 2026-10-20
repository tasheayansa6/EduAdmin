/** YouTube and Vimeo links play in their own embed; anything else is treated as a video file. */
function embedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
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

export function VideoPlayer({ url, title, onEnded }) {
  const embed = embedUrl(url);
  if (embed) {
    return (
      <iframe
        key={embed}
        src={embed}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }
  return (
    <video key={url} src={url} controls preload="metadata" className="h-full w-full bg-black" onEnded={onEnded}>
      <a href={url} target="_blank" rel="noreferrer">Open the video</a>
    </video>
  );
}
