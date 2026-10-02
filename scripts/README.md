# scripts/ — Live Demo Pipeline & Tooling

Every number in the shipped demo videos traces to a recorded run. This directory contains
**only** the scripts that produce, verify, or document the two live brand cuts plus repo tooling.
Superseded takes were demoted to local-only on 2026-10-01 (kept on disk at
`scratch/signoff/pruned/scripts/`, gitignored; recoverable from git history) — see the bottom of
this file for what moved and why.

## Mobile brand cut (Video 4) — live-data chain

Run order matters. Outputs: `demo-out/brand-live-recorded-artifact.json` (artifact of record),
`demo-out/brand-live-record-log.json` (taps), `public/demo/brand-mobile-demo.mp4`.

| # | Script | One-line role |
|---|---|---|
| 1 | `build-brand-live-static-acts.py` | Prepares the number-free narration acts (1/2/4/6/8) before recording — nothing invented |
| 2 | `record-brand-mobile.js` | Records the real app at 412×915 @2.5x, zero mocking — read-only CDP fetch-tee of the app's own SSE; every tap timestamped |
| 3 | `extract-brand-live-artifact.cjs` | Reconstructs the recorded SSE stream into the artifact of record (also used by the desktop chain via `--sse`/`--out`) |
| 4 | `build-brand-live-audio.py` | TTS for acts 3/5/7 spoken *from the recorded values*; SFX clicks at the recorded tap times; master mix |
| 5 | `mux-brand-mobile.js` | Full-take mux to mp4 + poster + separate `.srt` (captions not burned in) |

## Mobile Act 6 re-render (2026-10-01) — tolerance-fix correction

Re-renders only the tolerance-lever segment against the **same recorded artifact** so the shipped
video shows today's engine behavior (HIGH→PROCEED; see `scratch/signoff/video4-act6-rerender.md`).
Run order: record → audio → captions → mux; the mux script is resumable and splices at
[89.0s, 101.5s) without `-shortest`, shipping the full 136.52s capture.

| # | Script | One-line role |
|---|---|---|
| 1 | `record-mobile-act6-rerender.js` | Captures the replacement Act 6 through the real UI — recorded artifact restored via the app's own persistence seam, lever taps at the original cue times, verdicts read back from the DOM |
| 2 | `build-mobile-act6-audio-rerender.py` | Regenerates act6.mp3 (one word changed: REDUCE → PROCEED), same voice/rate/offsets; rebuilds the master voice + mix |
| 3 | `build-mobile-act6-captions-rerender.py` | Rewrites SRT/ASS cue 19 (and cue 18 timing) from real TTS sentence boundaries |
| 4 | `mux-brand-mobile-act6-rerender.js` | Splices the segment into the original capture and re-muxes at full capture length (fixes the 2.28s `-shortest` trim) |

## Desktop brand cut (Video 3) — live-data chain (rebuilt 2026-09-30)

| # | Script | One-line role |
|---|---|---|
| 1 | `record-brand-desktop.js` | Records the real app at 1280×720, zero mocking — read-only CDP fetch-tee, DOM verdict reads per tap, wall-clock heartbeat |
| 2 | `extract-brand-live-artifact.cjs` | Same extractor as mobile (`--sse`/`--out` select the desktop tee) |
| 3 | `build-brand-desktop-live-audio.py` | Acts 3/5/7 TTS from recorded values; Act 6 verdict words from captured DOM reads; SFX at recorded taps; writes the `.srt` |
| 4 | `mux-brand-desktop.js` | Final mux 1280×720 CRF 19 + poster (frozen-outro tail pad only if voice overruns) |

## Tooling (not demo-recording)

| Script | One-line role |
|---|---|
| `generate-ambient-cycle.py` | Synthesizes `demo-out/ambient-cycle.wav`, the 32s loopable bed both live audio builders mix under the voice (skips if present; `--force` to regenerate) |
| `ensure-bin-links.cjs` | Postinstall binary staging (wired in `package.json`) |
| `build-evidence-dump.cjs` | Regenerates the raw evidence ledger (kept locally at `docs/archive/EVIDENCE_DUMP.md`, not part of the judged tree) |
| `verify-us-equity-mcp.mjs` | Connectivity probe for the optional US Equity MCP endpoint |
| `probe-providers.ts` | Provider-connectivity probe used for the CONNECTIVITY_REPORT evidence |

## Demoted to local-only (2026-10-01)

23 superseded takes moved to gitignored `scratch/signoff/pruned/scripts/` (on disk, not in the
judged repo; recoverable from git history): the 90s/100s/submission audio+mux era
(`build-90s-demo-audio.py`, `build-100s-metacomm-audio.py`, `mux-final-90s-demo.js`,
`build-desktop-audio-mix.py`, `build-desktop-brand-audio.py`,
`build-desktop-brand-audio-mix.py`, `build-desktop-submission-audio-mix-upgraded.py`,
`build-mobile-audio-mix.py`, `build-mobile-brand-audio.py`, `build-mobile-brand-audio-mix.py`,
`build-submission-desktop-srt.py`), pre-rebuild desktop caption tooling
(`build-brand-desktop-srt.py`, `extract-brand-desktop-cues.py`), the superseded mobile sentence-cue
extractor (`extract-mobile-sentence-cues.py` — its live-chain successors are
`build-brand-live-audio.py` and `build-mobile-act6-captions-rerender.py`), the old screen-capture suite
(`capture-*.mjs` ×5), old recorders (`record-mobile-demo.js`, `record-official-1280x720.js`),
the 90s ambient generator (`generate-ambient-track.py` — its live-chain successor is
`generate-ambient-cycle.py`), and the superseded position-quality experiment
(`testPositionQuality.ts`). Every one was verified zero-referenced outside `scripts/` before the
move; `git grep` across the tracked tree returns no dangling references.
