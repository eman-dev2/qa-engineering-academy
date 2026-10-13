"use client";

import { useState } from "react";

/**
 * Click-to-play YouTube embed. Nothing is loaded from YouTube until the learner presses play;
 * then the privacy-enhanced (youtube-nocookie.com) player is used. Videos are never downloaded
 * or re-hosted.
 */
export function VideoEmbed({ youtubeId, title, playLabel, notice }: { youtubeId: string; title: string; playLabel: string; notice: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-md border border-line bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-line bg-[linear-gradient(135deg,var(--surface-2),var(--pen-soft))] p-4 text-center"
      aria-label={playLabel}
      title={notice}
    >
      <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-pen text-on-pen shadow-md transition-transform group-hover:scale-105">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" focusable={false}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="text-xs text-ink-2">{notice}</span>
    </button>
  );
}
