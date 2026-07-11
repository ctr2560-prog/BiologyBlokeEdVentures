"use client";
import { useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "@/components/ui/primitives";
import { HelpCircle, Sparkles } from "lucide-react";
import type { WatchSignals } from "./VideoPlayerMock";
import type { Video } from "@/types";

interface VideoPlayerProps {
  video: Video;
  onComplete: (signals: WatchSignals) => void;
}

export function VideoPlayer({ video, onComplete }: VideoPlayerProps) {
  const watchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const replayCountRef = useRef(0);
  const [clickedCurious, setClickedCurious] = useState(false);
  const [clickedHelp, setClickedHelp] = useState(false);
  const [ended, setEnded] = useState(false);

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
  };

  const finish = (completion: number) => {
    setEnded(true);
    onComplete({
      watchTimeSeconds: Math.round(watchedRef.current),
      completion: Math.round(completion),
      replayCount: replayCountRef.current,
      skipped: watchedRef.current < (video.durationSeconds ?? 60) * 0.25,
      clickedCurious,
      clickedHelp,
    });
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
          accentColor="#40916c"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          style={{ width: "100%", aspectRatio: "16/9" }}
        />

        {/* Overlay interaction buttons */}
        {!ended && (
          <div className="absolute bottom-16 right-4 flex flex-col gap-2">
            <button
              onClick={() => setClickedCurious(true)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-lift transition-all ${
                clickedCurious
                  ? "bg-gold-400 text-forest-900"
                  : "bg-white/90 text-forest-800 hover:bg-white"
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {clickedCurious ? "Curious!" : "I'm curious"}
            </button>
            <button
              onClick={() => setClickedHelp(true)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-lift transition-all ${
                clickedHelp
                  ? "bg-clay-400 text-white"
                  : "bg-white/90 text-forest-800 hover:bg-white"
              }`}
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
              {clickedHelp ? "Got it flagged" : "Need help"}
            </button>
          </div>
        )}
      </div>

      {!ended && (
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
