"use client";
import { useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "@/components/ui/primitives";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { WatchSignals } from "./VideoPlayerMock";
import type { Video } from "@/types";

interface VideoPlayerProps {
  video: Video;
  onComplete: (signals: WatchSignals) => void;
  /**
   * Optional live snapshot of the watch signals so far — lets the parent
   * advance on a swipe mid-video without waiting for a button press.
   */
  liveSignalsRef?: React.MutableRefObject<WatchSignals | null>;
  /** Hide the "Done watching" strip when the parent advances by swipe. */
  showDoneButton?: boolean;
}

export function VideoPlayer({ video, onComplete, liveSignalsRef, showDoneButton = true }: VideoPlayerProps) {
  const watchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const replayCountRef = useRef(0);
  const [reaction, setReaction] = useState<"like" | "dislike" | undefined>(undefined);
  const [ended, setEnded] = useState(false);

  const snapshotSignals = (react = reaction): WatchSignals => ({
    watchTimeSeconds: Math.round(watchedRef.current),
    completion: video.durationSeconds
      ? Math.min(99, Math.round((watchedRef.current / video.durationSeconds) * 100))
      : 50,
    replayCount: replayCountRef.current,
    skipped: watchedRef.current < (video.durationSeconds ?? 60) * 0.25,
    clickedCurious: false,
    clickedHelp: false,
    reaction: react,
  });

  const handleReaction = (r: "like" | "dislike") => {
    const next = reaction === r ? undefined : r; // Tap again to un-react
    setReaction(next);
    if (liveSignalsRef) liveSignalsRef.current = snapshotSignals(next);
  };

  const handleTimeUpdate = (e: Event) => {
    const el = e.target as HTMLVideoElement;
    const current = el.currentTime;
    const last = lastTimeRef.current;

    if (current < last - 2) {
      // Seeked backward more than 2s — counts as a replay
      replayCountRef.current += 1;
    } else if (current > last) {
      watchedRef.current += current - last;
    }
    lastTimeRef.current = current;
    if (liveSignalsRef) liveSignalsRef.current = snapshotSignals();
  };

  const finish = (completion: number) => {
    setEnded(true);
    onComplete({ ...snapshotSignals(), completion: Math.round(completion) });
  };

  const handleEnded = () => {
    finish(100);
  };

  // Allow finishing early if student navigates away or clicks done
  const handleEarlyFinish = () => {
    const completion = video.durationSeconds
      ? Math.min(99, Math.round((watchedRef.current / video.durationSeconds) * 100))
      : 50;
    finish(completion);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-forest-950 shadow-hero">
        <MuxPlayer
          playbackId={video.muxPlaybackId ?? ""}
          metadata={{ video_title: video.title }}
          streamType="on-demand"
          accentColor="#4f9776"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{ width: "100%", aspectRatio: "16/9" }}
        />

        {/* Overlay interaction buttons */}
        {!ended && (
          <div className="absolute bottom-16 right-4 flex flex-col gap-2">
            <button
              onClick={() => handleReaction("like")}
              aria-label="Like this video"
              aria-pressed={reaction === "like"}
              className={`grid h-10 w-10 place-items-center rounded-full shadow-lift transition-all ${
                reaction === "like"
                  ? "bg-forest-600 text-white scale-110"
                  : "bg-white/90 text-forest-800 hover:bg-white"
              }`}
            >
              <ThumbsUp className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => handleReaction("dislike")}
              aria-label="Dislike this video"
              aria-pressed={reaction === "dislike"}
              className={`grid h-10 w-10 place-items-center rounded-full shadow-lift transition-all ${
                reaction === "dislike"
                  ? "bg-clay-500 text-white scale-110"
                  : "bg-white/90 text-forest-800 hover:bg-white"
              }`}
            >
              <ThumbsDown className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {!ended && showDoneButton && (
        <div className="flex items-center justify-between rounded-2xl bg-forest-50 px-4 py-3">
          <p className="text-sm text-charcoal-soft">
            {video.learningIntent}
          </p>
          <Button variant="secondary" size="sm" onClick={handleEarlyFinish}>
            Done watching
          </Button>
        </div>
      )}
    </div>
  );
}
