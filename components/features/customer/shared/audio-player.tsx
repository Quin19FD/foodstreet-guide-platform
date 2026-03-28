"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/shared/utils";
import { speak, stopSpeaking } from "@/lib/tts";

export function AudioPlayer({
  script,
  language,
  autoPlay = false,
}: {
  script?: string | null;
  language?: string;
  autoPlay?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (autoPlay && script && !isSpeaking) {
      handlePlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const handlePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      setIsSpeaking(false);
      return;
    }

    speak({
      text: script || "",
      lang: language || "vi",
      rate: 0.9,
      onStart: () => {
        setIsPlaying(true);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setProgress(0);
      },
      onError: () => {
        setIsPlaying(false);
        setIsSpeaking(false);
        setProgress(0);
      },
    });
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  if (!script) {
    return (
      <div className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-500">
        Chưa có thuyết minh cho ngôn ngữ này
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
          <Volume2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Audio Guide</p>
          <p className="text-xs text-slate-500">
            {language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : language}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${isPlaying ? progress : 0}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 line-clamp-2">
          {script}
        </p>
        <button
          onClick={handlePlay}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
            isPlaying
              ? "bg-slate-200 text-slate-700"
              : "bg-orange-500 text-white shadow-lg shadow-orange-200"
          )}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
