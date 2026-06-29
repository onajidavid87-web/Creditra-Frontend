import { useMemo, useState } from 'react';
import './VideoThumbnail.css';

interface VideoThumbnailProps {
  title: string;
  videoId: string;
  transcriptUrl?: string;
}

const buildPoster = (title: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#11203b" />
          <stop offset="100%" stop-color="#1f5f99" />
        </linearGradient>
      </defs>
      <rect width="1280" height="720" rx="40" fill="url(#bg)" />
      <circle cx="640" cy="316" r="82" fill="rgba(230,237,243,0.18)" />
      <polygon points="620,270 620,362 692,316" fill="#ffffff" />
      <text x="640" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#ffffff">
        Creditra Help Video
      </text>
      <text x="640" y="512" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#dbeafe">
        ${title}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export function VideoThumbnail({
  title,
  videoId,
  transcriptUrl,
}: VideoThumbnailProps) {
  const [isActivated, setIsActivated] = useState(false);
  const posterSrc = useMemo(() => buildPoster(title), [title]);

  return (
    <div className="video-thumbnail" data-testid={`video-thumbnail-${videoId}`}>
      {isActivated ? (
        <div className="video-thumbnail-frame">
          <iframe
            title={title}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button
          type="button"
          className="video-thumbnail-button"
          aria-label={`Play video about ${title}`}
          onClick={() => setIsActivated(true)}
        >
          <img
            src={posterSrc}
            alt=""
            className="video-thumbnail-image"
            loading="lazy"
          />
          <span className="video-thumbnail-overlay">
            <span className="video-thumbnail-pill">Help video</span>
            <span className="video-thumbnail-title">{title}</span>
            <span className="video-thumbnail-play">Play video about {title}</span>
          </span>
        </button>
      )}

      {transcriptUrl && (
        <a
          className="video-thumbnail-transcript"
          href={transcriptUrl}
          target="_blank"
          rel="noreferrer"
        >
          Read transcript
        </a>
      )}
    </div>
  );
}
