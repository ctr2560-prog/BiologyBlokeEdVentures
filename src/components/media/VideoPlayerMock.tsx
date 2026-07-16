"use client";
/*
 * VideoPlayerMock, simulates a short-form reel and TRACKS real engagement
 * signals: watch time, % watched, replays, skip, curiosity + help clicks.
 * A real build swaps the timer loop for the media element's timeupdate events;
 * the tracked outputs stay identical so the adaptive engine is unchanged.
 */
import { useEffect, useRef, useState } from "react";
import { Button, Badge, ProgressBar } from "@/components/ui/primitives";
import { Play, Pause, ThumbsUp, ThumbsDown, RotateCcw, SkipForward, Check } from "lucide-react";
import type { Video } from "@/types";

export interface WatchSignals {
  watchTimeSeconds: number;
  completion: number;
  replayCount: number;
  skipped: boolean;
  clickedCurious: boolean;
  clickedHelp: boolean;
  /** TikTok-style reaction, saved to student_progress.video_reaction. */
  reaction?: "like" | "dislike";
}

export function VideoPlayerMock({
  video,
  onComplete,
  liveSignalsRef,
}: {
  video: Video;
  onComplete: (signals: WatchSignals) => void;
  /** Live snapshot of signals so far — enables swipe-to-advance mid-video. */
  liveSignalsRef?: React.MutableRefObject<WatchSignals | null>;
}) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0); // simulated seconds watched
  const [replays, setReplays] = useState(0);
  const [reaction, setReaction] = useState<"like" | "dislike" | undefined>(undefined);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleReaction = (r: "like" | "dislike") =>
    setReaction((prev) => (prev === r ? undefined : r));

  // Keep the parent's live snapshot in sync with the simulated playback.
  useEffect(() => {
    if (!liveSignalsRef) return;
    liveSignalsRef.current = {
      watchTimeSeconds: elapsed,
      completion: Math.min(100, Math.round((elapsed / video.durationSeconds) * 100)),
      replayCount: replays,
      skipped: elapsed < video.durationSeconds * 0.25,
      clickedCurious: false,
      clickedHelp: false,
      reaction,
    };
  }, [elapsed, replays, reaction, liveSignalsRef, video.durationSeconds]);

  // Play at 8x so a 90s reel simulates in ~11s, keeps the demo snappy.
  const SPEED = 8;
  const duration = video.durationSeconds;

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          if (next >= duration) {
            setPlaying(false);
            setFinished(true);
            return duration;
          }
          return next;
        });
      }, 1000 / SPEED);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, duration]);

  const completion = Math.min(100, Math.round((elapsed / duration) * 100));

  const replay = () => {
    setReplays((r) => r + 1);
    setElapsed(0);
    setFinished(false);
    setPlaying(true);
  };

  const skip = () => {
    setPlaying(false);
    finish(true);
  };

  const finish = (skipped = false) => {
    onComplete({
      watchTimeSeconds: elapsed,
      completion: Math.min(100, Math.round((elapsed / duration) * 100)),
      replayCount: replays,
      skipped,
      clickedCurious: false,
      clickedHelp: false,
      reaction,
    });
  };

  return (
    <div className="mx-auto max-w-md">
      {/* Vertical cinematic reel */}
      <div className="relative aspect-[9/14] overflow-hidden rounded-3xl shadow-hero"
        style={{ background: "linear-gradient(160deg, #0d2419 0%, #1b4332 50%, #2d6a4f 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* Animal "frame" */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[9rem] drop-shadow-2xl transition-transform duration-700 ${playing ? "scale-110" : "scale-100"}`}>
            {video.thumbEmoji}
          </span>
        </div>

        {/* Top tags */}
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
          {video.tags.slice(0, 3).map((t) => (
            <span key={t} className="glass rounded-full px-2.5 py-1 text-xs font-semibold text-forest-900">#{t}</span>
          ))}
        </div>

        {/* Bottom info + controls */}
        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-forest-950/90 to-transparent p-4 pt-16 text-cream">
          <h3 className="display text-lg font-bold">{video.title}</h3>
          <p className="line-clamp-2 text-sm text-forest-100/90">{video.description}</p>
          <ProgressBar value={completion} tone="gold" />
          <div className="flex items-center justify-between text-xs text-forest-100/80">
            <span>{elapsed}s / {duration}s</span>
            <span>{completion}% watched {replays > 0 && `· ${replays} replays`}</span>
          </div>
        </div>

        {/* Center play button */}
        {!playing && !finished && (
          <button
            onClick={() => setPlaying(true)}
            aria-label="Play"
            className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass text-forest-800 shadow-lift transition-transform hover:scale-105"
          >
            <Play className="h-8 w-8" aria-hidden />
          </button>
        )}
        {playing && (
          <button
            onClick={() => setPlaying(false)}
            aria-label="Pause"
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full glass-dark text-cream opacity-0 transition-opacity hover:opacity-100"
          >
            <Pause className="h-6 w-6" aria-hidden />
          </button>
        )}
      </div>

      {/* Reactions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => toggleReaction("like")}
          aria-label="Like this video"
          aria-pressed={reaction === "like"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${reaction === "like" ? "bg-forest-600 text-white" : "bg-forest-50 text-forest-700"}`}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden /> Like
        </button>
        <button
          onClick={() => toggleReaction("dislike")}
          aria-label="Dislike this video"
          aria-pressed={reaction === "dislike"}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${reaction === "dislike" ? "bg-clay-500 text-white" : "bg-clay-400/15 text-clay-600"}`}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden /> Dislike
        </button>
      </div>

      {/* Nav controls */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={replay}><RotateCcw className="h-4 w-4" aria-hidden /> Replay</Button>
        {!finished ? (
          <Button variant="secondary" size="sm" onClick={skip}>Skip <SkipForward className="h-4 w-4" aria-hidden /></Button>
        ) : (
          <Badge tone="forest"><Check className="h-3 w-3" aria-hidden /> Finished</Badge>
        )}
        <Button size="sm" onClick={() => finish(false)} disabled={elapsed === 0}>
          Continue to quiz
        </Button>
      </div>
    </div>
  );
}
