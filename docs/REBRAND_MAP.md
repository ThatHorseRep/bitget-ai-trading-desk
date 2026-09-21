# Bitget AI RedTeam Desk — Rebrand Conversion Map

This map documents the conversion of neutral Tailwind classes to `--rt-*` design tokens defined in `docs/IDENTITY_TOKENS.md`.

## Conversion Table

| CURRENT_CLASS | OCCURRENCES | REPLACEMENT_TOKEN_CLASS | ROLE & RATIONALE |
|---|---|---|---|
| `text-zinc-500` | 63 | `text-[var(--rt-text-muted)]` | Secondary typography, metadata, subtitles, timestamps, and captions (Steel `#54697E`). |
| `border-zinc-200` | 60 | `border-[var(--rt-border-subtle)]` | Structural 1px hairline container borders, dividers, table cell lines (`#CFD4CF`). |
| `text-zinc-900` | 40 | `text-[var(--rt-text-primary)]` | Primary display titles, headings, and high-contrast figures (Blueprint Navy `#0E2436`). |
| `bg-zinc-50` | 30 | `bg-[var(--rt-surface-raised)]` | Elevated card surfaces, paper containers, active tab fills (Paper `#F7F8F6`). |
| `text-zinc-800` | 25 | `text-[var(--rt-text-primary)]` | Body prose, readable copy, and structured metric labels (`#0E2436`). |
| `ring-zinc-900` | 22 | `ring-[var(--rt-text-muted)]` | Focus ring outline for keyboard accessibility per Table 3 & Gaps spec. |
| `text-zinc-700` | 17 | `text-[var(--rt-text-primary)]` | Section headers and high-contrast summary text (`#0E2436`). |
| `bg-zinc-900` | 13 | `bg-[var(--rt-surface-void)]` | Dark chrome, high-emphasis action buttons, and void surfaces (Deep Field `#06121C`). |
| `text-zinc-600` | 12 | `text-[var(--rt-text-muted)]` | Secondary helper descriptions and sub-labels (`#54697E`). |
| `border-zinc-100` | 9 | `border-[var(--rt-border-subtle)]` | Subtle dividing lines and inner borders (`#CFD4CF`). |
| `bg-zinc-100` | 8 | `bg-[var(--rt-surface-base)]` | Ground / page background and neutral badges (Proof Gray `#E7E9E6`). |
| `text-zinc-400` | 7 | `text-[var(--rt-text-muted)]` | Light captions and placeholder indicators (`#54697E`). |
| `border-zinc-300` | 7 | `border-[var(--rt-border-subtle)]` | Input borders and secondary container borders (`#CFD4CF`). |
| `bg-zinc-800` | 6 | `hover:bg-[var(--rt-text-primary)]` | Primary button hover state (`#0E2436`). |
| `bg-zinc-200` | 6 | `bg-[var(--rt-surface-base)]` | Chip badges and track surfaces (`#E7E9E6`). |
| `border-zinc-900` | 3 | `border-[var(--rt-text-primary)]` | Focused input border and high-contrast borders (`#0E2436`). |
| `text-zinc-300` | 2 | `text-[var(--rt-surface-raised)]` | Light text on void / dark surfaces (`#F7F8F6`). |
| `to-zinc-600` | 1 | `to-[var(--rt-text-muted)]` | Gradient stopping point to muted text (`#54697E`). |
