"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Monitor,
  Smartphone,
  Check,
  FastForward
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
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(100);
  const [forcedDeviceMode, setForcedDeviceMode] = useState<"AUTO" | "DESKTOP" | "MOBILE">("AUTO");
  const [activeChapterId, setActiveChapterId] = useState<string>("input");

  // Get active video element based on viewport or forced override
  const getActiveVideo = () => {
    if (forcedDeviceMode === "DESKTOP") return desktopVideoRef.current;
    if (forcedDeviceMode === "MOBILE") return mobileVideoRef.current;
    // Auto: inspect window width if client
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return mobileVideoRef.current || desktopVideoRef.current;
    }
    return desktopVideoRef.current || mobileVideoRef.current;
  };

  const syncTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setCurrentTime(v.currentTime);
    if (v.duration && !isNaN(v.duration) && v.duration > 0) {
      setDuration(v.duration);
    }

    // Determine current active chapter
    const t = v.currentTime;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (t >= CHAPTERS[i].timeSec) {
        setActiveChapterId(CHAPTERS[i].id);
        break;
      }
    }
  };

  const handlePlayPause = () => {
    const v = getActiveVideo();
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (desktopVideoRef.current) desktopVideoRef.current.muted = nextMuted;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (desktopVideoRef.current) desktopVideoRef.current.playbackRate = speed;
    if (mobileVideoRef.current) mobileVideoRef.current.playbackRate = speed;
  };

  const handleSeekChapter = (chapterTime: number) => {
    if (desktopVideoRef.current) {
      desktopVideoRef.current.currentTime = chapterTime;
      if (desktopVideoRef.current.paused) desktopVideoRef.current.play().catch(() => {});
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.currentTime = chapterTime;
      if (mobileVideoRef.current.paused) mobileVideoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  };

  const handleRestart = () => {
    handleSeekChapter(0);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Reveal as="section" id="demo-walkthrough" className="scroll-mt-24 border-b border-[var(--rtd-steel)]/25 py-16 sm:py-20 px-4 sm:px-6 bg-[var(--rtd-proof)]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
                00 • PRODUCT WALKTHROUGH
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--rtd-void)] text-white uppercase font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIABLE END-TO-END DEMO
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
              See the adversarial engine in action.
            </h2>
            <p className="text-sm sm:text-base text-[var(--rtd-steel)] font-sans leading-relaxed">
              Watch a trader enter a natural language trade during the 65.5-hour weekend window, survive adversarial Red Teaming, and receive deterministic scenario stress results.
            </p>
          </div>

          {/* Desktop/Mobile Device Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-1 font-mono text-xs shrink-0 self-start md:self-end">
            <span className="text-[10px] uppercase font-bold text-[var(--rtd-steel)] px-2">VIEWPORT:</span>
            <button
              type="button"
              onClick={() => setForcedDeviceMode("AUTO")}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                forcedDeviceMode === "AUTO"
                  ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)]"
                  : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
              }`}
            >
              AUTO
            </button>
            <button
              type="button"
              onClick={() => setForcedDeviceMode("DESKTOP")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                forcedDeviceMode === "DESKTOP"
                  ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)]"
                  : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              DESKTOP (16:9)
            </button>
            <button
              type="button"
              onClick={() => setForcedDeviceMode("MOBILE")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                forcedDeviceMode === "MOBILE"
                  ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)]"
                  : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              MOBILE (9:16)
            </button>
          </div>
        </div>

        {/* Video Player Display Card */}
        <div className="bg-[var(--rtd-void)] text-white border border-[var(--rtd-steel)]/30 shadow-xl overflow-hidden">
          
          {/* Top Terminal Bar */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-slate-400 font-semibold tracking-wider text-[11px] uppercase">
                BITGET REDTEAM DESK // CANONICAL WEEKEND RUN (rNVDA $2,000 LONG)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold">
                1080P HD
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DETERMINISTIC PLAYBACK
              </span>
            </div>
          </div>

          {/* Main Video Screen Area */}
          <div className="relative bg-black flex items-center justify-center min-h-[300px] sm:min-h-[420px] md:min-h-[500px]">
            
            {/* Desktop Video View (Shown by default on >= md or when forced) */}
            <div
              className={`w-full h-full aspect-video ${
                forcedDeviceMode === "DESKTOP"
                  ? "block"
                  : forcedDeviceMode === "MOBILE"
                  ? "hidden"
                  : "hidden md:block"
              }`}
            >
              <video
                ref={desktopVideoRef}
                src="/demo/desktop-demo.mp4"
                className="w-full h-full object-contain cursor-pointer"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onClick={handlePlayPause}
                onTimeUpdate={syncTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>

            {/* Mobile Video View (Shown on < md or when forced) */}
            <div
              className={`py-4 px-2 flex justify-center items-center w-full ${
                forcedDeviceMode === "MOBILE"
                  ? "block"
                  : forcedDeviceMode === "DESKTOP"
                  ? "hidden"
                  : "block md:hidden"
              }`}
            >
              <div className="relative w-[280px] sm:w-[320px] aspect-[412/915] border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black">
                <video
                  ref={mobileVideoRef}
                  src="/demo/mobile-demo.mp4"
                  className="w-full h-full object-cover cursor-pointer"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={handlePlayPause}
                  onTimeUpdate={syncTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            </div>

            {/* Play/Pause Overlay Indicator when paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label="Play video"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[var(--rtd-stamp)]/90 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
              >
                <Play className="w-8 h-8 translate-x-0.5 fill-white" />
              </button>
            )}
          </div>

          {/* Timeline Progress Bar */}
          <div
            className="w-full h-2 bg-slate-800 cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              handleSeekChapter(ratio * duration);
            }}
          >
            <div
              className="h-full bg-[var(--rtd-stamp)] transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Player Controls Bar */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Left Controls: Play, Restart, Time */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-300 font-mono tracking-wider">
                <span className="font-bold text-white">{formatTime(currentTime)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Center: Chapter Tag Indicator */}
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
                title={isMuted ? "Unmute narration" : "Mute audio"}
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
