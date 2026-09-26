"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Check
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

interface BrandedDemoPlayerProps {
  onLaunchDesk: (initialPrompt?: string) => void;
}

const GOLDEN_PATH_PROMPT =
  "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.";

interface Chapter {
  id: string;
  timeSec: number;
  label: string;
  tag: string;
}

const CHAPTERS: Chapter[] = [
  { id: "input", timeSec: 0, label: "00:00 Trade Intake", tag: "Natural Language" },
  { id: "market", timeSec: 25, label: "00:25 Market Reconstruct", tag: "65.5h Basis Gap" },
  { id: "redteam", timeSec: 48, label: "00:48 Adversarial Red Team", tag: "Thesis Attack" },
  { id: "shocks", timeSec: 68, label: "01:08 Deterministic Shocks", tag: "4 Tail Scenarios" },
  { id: "verdict", timeSec: 88, label: "01:28 Gated Policy & Sandbox", tag: "Audit Provenance" },
];

export function BrandedDemoPlayer({ onLaunchDesk }: BrandedDemoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(100);
  const [activeChapterId, setActiveChapterId] = useState<string>("input");
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Auto-detect screen width to serve the matching responsive video recording
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentVideoSrc = isMobileScreen ? "/demo/mobile-demo.mp4" : "/demo/desktop-demo.mp4";

  // IntersectionObserver: Automatically play when in view, pause when scrolled past
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          // Play automatically when visible in viewport
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          // Pause when user scrolls away to save resources and battery
          if (!video.paused) {
            video.pause();
            setIsPlaying(false);
          }
        }
      },
      {
        threshold: 0.25,
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Video event handlers with 200ms throttle to prevent main-thread scroll jank
  const lastTimeUpdateRef = useRef<number>(0);
  const activeChapterRef = useRef<string>("input");

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime;
    const now = performance.now();

    // Determine current chapter
    let newChapterId = CHAPTERS[0].id;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (t >= CHAPTERS[i].timeSec) {
        newChapterId = CHAPTERS[i].id;
        break;
      }
    }

    const chapterChanged = newChapterId !== activeChapterRef.current;
    if (chapterChanged) {
      activeChapterRef.current = newChapterId;
      setActiveChapterId(newChapterId);
    }

    // Throttle React state updates to 200ms intervals unless chapter boundary changed
    if (chapterChanged || now - lastTimeUpdateRef.current >= 200) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(t);

      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
    video.playbackRate = playbackSpeed;
    video.muted = isMuted;
  }, [playbackSpeed, isMuted]);

  const handleDurationChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted && video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [isMuted]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
    }
  }, []);

  const handleSeekChapter = useCallback((chapterTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const totalDuration = video.duration && !isNaN(video.duration) && video.duration > 0 ? video.duration : duration;
    const targetTime = Math.max(0, Math.min(totalDuration, chapterTime));
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  }, [duration]);

  const handleRestart = useCallback(() => {
    handleSeekChapter(0);
  }, [handleSeekChapter]);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const totalDuration = video.duration && !isNaN(video.duration) && video.duration > 0 ? video.duration : duration;
    const targetTime = ratio * totalDuration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  }, [duration]);

  const handleProgressTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, touchX / rect.width));
    const totalDuration = video.duration && !isNaN(video.duration) && video.duration > 0 ? video.duration : duration;
    const targetTime = ratio * totalDuration;
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  }, [duration]);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Reveal as="section" id="demo-walkthrough" className="scroll-mt-24 border-b border-[var(--rtd-steel)]/25 py-16 sm:py-20 px-4 sm:px-6 bg-[var(--rtd-proof)]">
      <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
              00 • PRODUCT WALKTHROUGH
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--rtd-void)] text-white uppercase font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AUTO-PLAY IN VIEW
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
            See the adversarial engine in action.
          </h2>
          <p className="text-sm sm:text-base text-[var(--rtd-steel)] font-sans leading-relaxed">
            Watch a trader enter a natural language trade during the 65.5-hour weekend window, survive adversarial Red Teaming, and receive deterministic scenario stress results.
          </p>
        </div>

        {/* Video Player Display Container */}
        <div className="bg-[var(--rtd-void)] text-white border border-[var(--rtd-steel)]/30 shadow-xl overflow-hidden">
          
          {/* Top Terminal Bar */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-slate-300 font-semibold tracking-wider text-[11px] uppercase">
                BITGET REDTEAM DESK // CANONICAL RUN ({isMobileScreen ? "MOBILE PORTRAIT" : "DESKTOP 1080P"})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold">
                {isMobileScreen ? "PORTRAIT" : "1080P HD"}
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {isPlaying ? "PLAYING" : "PAUSED"}
              </span>
            </div>
          </div>

          {/* Main Video View Area */}
          <div className="relative bg-black flex items-center justify-center min-h-[280px] sm:min-h-[400px] md:min-h-[500px]">
            
            {/* Unified Video Wrapper */}
            <div
              className={
                isMobileScreen
                  ? "py-4 px-2 flex justify-center items-center w-full"
                  : "w-full h-full aspect-video flex items-center justify-center"
              }
            >
              <div
                className={
                  isMobileScreen
                    ? "relative w-[280px] sm:w-[320px] aspect-[412/915] border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black"
                    : "w-full h-full aspect-video"
                }
              >
                <video
                  ref={videoRef}
                  key={currentVideoSrc}
                  src={currentVideoSrc}
                  playsInline
                  muted={isMuted}
                  loop
                  className={
                    isMobileScreen
                      ? "w-full h-full object-cover cursor-pointer"
                      : "w-full h-full object-contain cursor-pointer"
                  }
                  onClick={handleTogglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onDurationChange={handleDurationChange}
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
              </div>
            </div>

            {/* Big Center Play Overlay Button when paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label="Play video"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[var(--rtd-stamp)]/90 hover:bg-[var(--rtd-stamp)] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl cursor-pointer z-20"
              >
                <Play className="w-8 h-8 translate-x-0.5 fill-white" />
              </button>
            )}
          </div>

          {/* Interactive Timeline Progress Bar */}
          <div
            className="w-full h-3 bg-slate-800 cursor-pointer relative group touch-none"
            onClick={handleProgressBarClick}
            onTouchStart={handleProgressTouch}
            onTouchMove={handleProgressTouch}
            title="Click or drag to seek"
          >
            <div
              className="h-full bg-[var(--rtd-stamp)] transition-all duration-75 relative pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Player Controls Bar */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Left Controls: Play, Restart, Time */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer rounded-xs"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer rounded-xs"
                title="Restart from 00:00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-300 font-mono tracking-wider">
                <span className="font-bold text-white">{formatTime(currentTime)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Center: Active Stage Pill */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] bg-slate-900 border border-slate-800 px-3 py-1 text-slate-300">
              <span className="text-[10px] text-slate-500 uppercase">ACTIVE STAGE:</span>
              <span className="text-[var(--rtd-proceed)] font-bold">
                {CHAPTERS.find((c) => c.id === activeChapterId)?.label ?? "00:00 Trade Intake"}
              </span>
            </div>

            {/* Right Controls: Speed, Audio, Launch CTA */}
            <div className="flex items-center gap-2">
              {/* Speed Buttons */}
              <div className="flex items-center bg-slate-900 border border-slate-800 text-[10px]">
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-1 font-mono transition-colors cursor-pointer ${
                      playbackSpeed === speed
                        ? "bg-slate-700 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Audio Mute/Unmute */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer border ${
                  isMuted
                    ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                }`}
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold uppercase">{isMuted ? "MUTE" : "AUDIO ON"}</span>
              </button>

              {/* Instant Run Button */}
              <button
                type="button"
                onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
                className="px-4 py-1.5 bg-[var(--rtd-stamp)] text-white hover:brightness-110 active:scale-95 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>RUN THIS LIVE</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Interactive Chapter Cue Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-800/80 divide-y sm:divide-y-0 divide-x divide-slate-800/60 bg-slate-950 font-mono text-xs">
            {CHAPTERS.map((ch) => {
              const isActive = activeChapterId === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSeekChapter(ch.timeSec)}
                  className={`p-3 text-left transition-all cursor-pointer space-y-1 ${
                    isActive
                      ? "bg-slate-900 text-white border-b-2 border-b-[var(--rtd-stamp)]"
                      : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${isActive ? "text-[var(--rtd-proceed)]" : "text-slate-500"}`}>
                      {ch.label.split(" ")[0]}
                    </span>
                    <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-800 text-slate-400">
                      {ch.tag}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold truncate">
                    {ch.label.substring(6)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights Grid Below Video */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs text-[var(--rtd-steel)]">
          <div className="p-4 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/20 space-y-1.5">
            <div className="font-mono text-xs font-bold text-[var(--rtd-ink)] uppercase flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Realistic Weekend Conditions</span>
            </div>
            <p className="leading-relaxed">
              Demonstrates an authentic 65.5-hour market closure with unhedged basis premiums and wide off-hours spreads.
            </p>
          </div>

          <div className="p-4 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/20 space-y-1.5">
            <div className="font-mono text-xs font-bold text-[var(--rtd-ink)] uppercase flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adversarial Red Team</span>
            </div>
            <p className="leading-relaxed">
              Attacks qualitative user assumptions (Capex demand vs. BTC macro contagion) with structured counter-arguments.
            </p>
          </div>

          <div className="p-4 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/20 space-y-1.5">
            <div className="font-mono text-xs font-bold text-[var(--rtd-ink)] uppercase flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deterministic Policy Gating</span>
            </div>
            <p className="leading-relaxed">
              Prevents retail capital destruction via automated size reduction and wait recommendations with full audit provenance.
            </p>
          </div>
        </div>

      </div>
    </Reveal>
  );
}
