/**
 * build-demo.ts - runs the REAL desk workflow, then generates the 60s demo assets from the resulting artifact.
 * Put this file in the project root (next to /src) and run:
 *   npx tsx build-demo.ts --asset rNVDA --size 2000 --dir LONG --thesis "..." --mode fixture --start landing --format wide --audio both --out ./demo-out
 * Flags: --mode fixture|live  --start landing|desk  --format wide|mobile  --audio vo|sfx|both
 */
import { mkdirSync, writeFileSync } from "fs";
import { DecisionDeskService } from "./src/services/decisionDeskService";

const arg = (k: string, d?: string) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const intake = {
  asset: arg("asset", "rNVDA")!, size: Number(arg("size", "2000")), dir: (arg("dir", "LONG")!.toUpperCase()) as "LONG" | "SHORT",
  thesis: arg("thesis", "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.")!,
  mode: arg("mode", "fixture")!, start: arg("start", "landing")!, format: arg("format", "wide")!, audio: arg("audio", "both")!, out: arg("out", "./demo-out")!,
};
const ones = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
const words = (n: number): string => { n = Math.round(Math.abs(n)); if (n < 20) return ones[n]; if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : ""); if (n < 1000) return ones[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + words(n % 100) : ""); return words(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + words(n % 1000) : ""); };
const usd = (n: number) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toFixed(Math.abs(n) % 1 < 0.005 ? 0 : 2)}`;
const NAMES: Record<string, string> = { NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", MSTR: "MicroStrategy", COIN: "Coinbase" };
const SCN: Record<string, string> = { MARKET_RISK: "market drop", CRYPTO_CONTAGION: "BTC contagion", TOKEN_MICROSTRUCTURE: "a wider basis", COMBINED_SHOCK: "the combined shock", THESIS_FAILURE: "thesis failure" };
const OFF = ["WEEKEND", "CLOSED", "AFTER_HOURS", "PRE_MARKET", "OFF_HOURS"];

(async () => {
  const svc = new DecisionDeskService();
  const res = await svc.runWorkflow({ asset: intake.asset, direction: intake.dir, positionSizeUsd: intake.size, thesis: intake.thesis } as any, { useFixture: intake.mode === "fixture" });
  if (res.step !== "DECISION_READY" || !res.artifact) throw new Error(`Workflow returned ${res.step}. Fix the intake (asset/size/thesis) and rerun. ${res.limitations.join(" | ")}`);
  const a = res.artifact, ms = a.marketState, v = a.decision.verdict;
  const tq = a.thesisPosition?.thesisQuality ?? null, pqual = a.thesisPosition?.positionQuality.quality ?? null;
  const offHours = OFF.includes(ms.sessionStatus as string);
  const refName = NAMES[ms.referenceSymbol ?? ""] ?? ms.referenceSymbol ?? "the stock";
  const live = a.dataSource === "live";
  const warnings: string[] = [];
  if (!live && intake.mode === "live") warnings.push("Requested live mode but the desk fell back to fixture data: " + (a.fallbackReason ?? "unknown reason") + ". Do NOT narrate this as live.");
  if (!live) warnings.push("FIXTURE data: keep the banner in frame; do not narrate as live.");
  if (a.limitations.length) warnings.push("Desk limitations shown in UI: " + a.limitations.join(" | "));
  if (!a.challenge) warnings.push("No counter-thesis generated (LLM unavailable?) - beat 4 shows the deterministic assessment only.");

  // worst applicable scenario
  const scored = a.scenarios.filter(s => s.applicable && s.estimatedPnlUsd !== null && s.estimatedPnlPct !== null);
  const worst = scored.reduce((w, s) => (s.estimatedPnlUsd! < w.estimatedPnlUsd! ? s : w), scored[0]);
  const wLoss = worst ? Math.abs(worst.estimatedPnlUsd!) : 0;
  const rule = a.decision.reasons[0]?.code ?? "n/a";
  const counts = a.provenance.reduce((m: any, p) => (m[p.type] = (m[p.type] ?? 0) + 1, m), {});

  // ---- dynamic lines, chosen by real engine output ----
  const hookVo = offHours ? "Tokenized stocks trade all weekend. NYSE doesn't. Your chart hides that gap." : "Tokenized stocks trade around the clock. Your chart doesn't tell you what that costs.";
  const hookCard = offHours ? "NYSE is closed 65.5h. Tokenized stocks aren't." : "24/7 trading. Hidden basis risk.";
  const inputVo = "Describe your trade in plain English, thesis included. One sentence, no forms.";
  const marketVo = offHours
    ? `The desk checks what your chart can't: ${intake.asset} sits ${Math.abs(ms.basisPct ?? 0).toFixed(2)}% ${(ms.basisPct ?? 0) >= 0 ? "above" : "below"} ${refName}'s last close, with 65 hours until anyone can arbitrage it.`
    : `The desk checks the real market state: ${intake.asset} is ${Math.abs(ms.basisPct ?? 0).toFixed(2)}% ${(ms.basisPct ?? 0) >= 0 ? "above" : "below"} ${refName}, with a ${(ms.spreadPct ?? 0).toFixed(2)}% spread.`;
  const marketCard = `${(ms.basisPct ?? 0) >= 0 ? "Paying" : "Selling at"} ${(ms.basisPct ?? 0) >= 0 ? "+" : ""}${(ms.basisPct ?? 0).toFixed(2)}% vs the real stock.${offHours ? " Nobody can close it till Monday." : ""}`;
  const strongT = tq === "STRONGER" || tq === "MIXED";
  const redVo = strongT && pqual === "WEAKER" ? "Then it argues against you. Your thesis is strong, but your position isn't, and you'd never have seen why."
    : tq === "WEAKER" ? "Then it argues against you, and your thesis doesn't survive the counter-case."
    : "Then it argues against you, and it can't break your setup.";
  const redCard = strongT && pqual === "WEAKER" ? "Thesis: stronger. Position: weaker." : tq === "WEAKER" ? "Thesis: weaker." : "Thesis and position hold.";
  const stressVo = worst
    ? `Market drop, BTC contagion, a wider basis. All deterministic math, no AI-invented numbers. Worst case, ${SCN[worst.id] ?? worst.name.toLowerCase()}: ${worst.estimatedPnlUsd! < 0 ? "minus" : "plus"} ${words(wLoss)} dollars.`
    : "The desk stress-tests the position with deterministic math, no AI-invented numbers.";
  const verdictVo = ({
    WAIT: "Verdict: WAIT until Monday's open, and here's exactly what would change that.",
    REDUCE: "Verdict: REDUCE. Same thesis, smaller size, and here's exactly why.",
    REJECT: "Verdict: REJECT. Here's what breaks it, and what would change that.",
    PROCEED: "Verdict: PROCEED. It survives every scenario, and you still make the final call.",
  } as any)[v] ?? `Verdict: ${v}.`;
  const verdictCard = v === "PROCEED" ? "It holds. You still decide." : "Not just an answer: the exact conditions that flip it.";
  const provVo = "Every number is tagged: observed, calculated, or AI opinion. Nothing's a black box.";
  const endVo = "Bitget AI RedTeam Desk. Stress-test before the market does.";
  const endCard = `You decide. The desk makes sure you decide with eyes open.${live ? " Live Bitget data." : ""}`;

  const startScreen = intake.start === "landing" ? "Landing hero; hold on '65.5 hours after NYSE closes'." : "Open directly in the Desk workspace; banner + input visible.";
  type Beat = { id: string; t0: number; t1: number; screen: string; vo: string; card: string; sfx: string[] };
  const beats: Beat[] = [
    { id: "HOOK", t0: 0, t1: 5, screen: startScreen, vo: hookVo, card: hookCard, sfx: ["0.0 low sub-bass swell", "3.5 tick + short riser into cut"] },
    { id: "INPUT", t0: 5, t1: 13, screen: `${intake.start === "landing" ? "Click 'Stress a trade'; " : ""}thesis types out (sped up)${live ? "" : "; FIXTURE banner visible"}; click 'Run Adversarial Desk'.`, vo: inputVo, card: "Type it like you'd say it.", sfx: ["5.2 soft click", "6.0-10.5 keyboard typing bed", "12.2 button click + confirm blip"] },
    { id: "MARKET", t0: 13, t1: 21, screen: `Loader, then market state: token $${ms.instrumentPrice?.toFixed(2)} vs ${ms.referenceSymbol} $${ms.referencePrice?.toFixed(2)}, basis ${(ms.basisPct ?? 0) >= 0 ? "+" : ""}${(ms.basisPct ?? 0).toFixed(2)}%, session ${ms.sessionStatus}.`, vo: marketVo, card: marketCard, sfx: ["13.0 scanning whoosh", "16.5 data lock-in ticks", "18.0 low pulse on the basis figure"] },
    { id: "REDTEAM", t0: 21, t1: 30, screen: `Counter-thesis card${a.challenge?.vulnerableAssumptions?.length ? `; highlight: ${a.challenge.vulnerableAssumptions.slice(0, 2).map(x => `'${x}'`).join(" and ")}` : ""}.`, vo: redVo, card: redCard, sfx: ["21.0 card slide whoosh", "24.0 tension drone under counter-thesis", "27.5 'crack' hit on the position line"] },
    { id: "STRESS", t0: 30, t1: 41, screen: `Scenario rows count up: ${a.scenarios.filter(s => s.estimatedPnlUsd !== null).map(s => `${SCN[s.id] ?? s.name} ${usd(s.estimatedPnlUsd!)} (${s.estimatedPnlPct!.toFixed(1)}%)`).join(", ")}.`, vo: stressVo, card: "AI argues. Math decides.", sfx: ["30.5 / 32.5 / 34.5 counter ticks per row", "38.0 heavier tick on worst row", "39.0 low impact on final figure"] },
    { id: "VERDICT", t0: 41, t1: 49, screen: `Verdict banner (${v}), then the 'what would change this' list${a.changeConditions[0] ? `: "${a.changeConditions[0]}"` : ""}.`, vo: verdictVo, card: verdictCard, sfx: ["41.2 stamp/impact on verdict", "41.4 short alert tone", "45.0 soft list-item ticks"] },
    { id: "PROVENANCE", t0: 49, t1: 55, screen: `Open Provenance drawer (${Object.entries(counts).map(([k, n]) => `${n}x ${k}`).join(", ")}); rule code ${rule}.`, vo: provVo, card: "Every number, sourced.", sfx: ["49.0 drawer slide", "51.0 tag pops (light ticks)"], },
    { id: "END", t0: 55, t1: 60, screen: "Logo, end line, URL, hashtags, 'Track 3 - Decision Stress Testing'.", vo: endVo, card: endCard, sfx: ["55.0 logo whoosh", "57.5 resolve chord, fade out by 60.0"] },
  ];

  const wc = beats.reduce((n, b) => n + b.vo.split(/\s+/).length, 0);
  if (wc > 135) warnings.push(`VO is ${wc} words (>135): too dense for 60s. Trim before recording.`);
  const canvas = intake.format === "mobile" ? "Mobile vertical 9:16 (1080x1920)" : "Desktop widescreen (1536x960)";
  const wrapAt = intake.format === "mobile" ? 30 : 60;
  const wrap = (s: string) => { const out: string[] = []; let line = ""; for (const w of s.split(" ")) { if ((line + " " + w).trim().length > wrapAt) { out.push(line); line = w; } else line = (line + " " + w).trim(); } out.push(line); return out.join("\n"); };
  const ts = (s: number) => { const m = Math.round(s * 1000); const p = (n: number, l = 2) => String(n).padStart(l, "0"); return `${p(Math.floor(m / 3600000))}:${p(Math.floor(m % 3600000 / 60000))}:${p(Math.floor(m % 60000 / 1000))},${p(m % 1000, 3)}`; };
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const header = `${intake.asset} ${intake.dir} $${intake.size} | data: ${live ? "LIVE" : "FIXTURE"} | ${canvas} | start: ${intake.start}`;

  mkdirSync(intake.out, { recursive: true });
  if (intake.audio !== "sfx") {
    let t = `VOICEOVER SCRIPT - Bitget AI RedTeam Desk (60s)\n${header}\n\n--- CLEAN READ (paste into any TTS) ---\n\n${beats.map(b => b.vo).join("\n\n")}\n\nWord count: ${wc} (~${Math.round(wc / 2.5)}s of speech)\n\n--- TIMED (for the editor) ---\n\n${beats.map(b => `[${mmss(b.t0)}-${mmss(b.t1)}] ${b.id}\n${b.vo}\nScreen: ${b.screen}`).join("\n\n")}\n`;
    writeFileSync(`${intake.out}/vo-script.txt`, t);
    let srt = "", i = 1;
    for (const b of beats) { const s0 = b.t0 + 0.3, s1 = b.t1 - 0.3, sents = b.vo.match(/[^.!?]+[.!?]+/g)!.map(x => x.trim()), tot = sents.reduce((n, x) => n + x.split(/\s+/).length, 0); let cur = s0; for (const s of sents) { const d = (s1 - s0) * s.split(/\s+/).length / tot; srt += `${i++}\n${ts(cur)} --> ${ts(cur + d)}\n${wrap(s)}\n\n`; cur += d; } }
    writeFileSync(`${intake.out}/vo-captions.srt`, srt);
  }
  if (intake.audio !== "vo") {
    writeFileSync(`${intake.out}/sfx-only-cuesheet.txt`, `SOUND-EFFECTS-ONLY CUE SHEET - no voiceover, title cards carry the message\n${header}\n\n` + beats.map(b => `[${mmss(b.t0)}-${mmss(b.t1)}] ${b.id}\nTITLE CARD: ${b.card}\nSCREEN: ${b.screen}\nSFX: ${b.sfx.join(" | ")}`).join("\n\n") + "\n");
  }
  writeFileSync(`${intake.out}/run-report.json`, JSON.stringify({ intake, dataSource: a.dataSource, verdict: v, ruleCode: rule, thesisQuality: tq, positionQuality: pqual, market: { token: ms.instrumentPrice, reference: ms.referencePrice, basisPct: ms.basisPct, spreadPct: ms.spreadPct, session: ms.sessionStatus, observedAt: ms.observedAt }, scenarios: a.scenarios.map(s => ({ id: s.id, pnlUsd: s.estimatedPnlUsd, pnlPct: s.estimatedPnlPct })), changeConditions: a.changeConditions, provenanceCounts: counts, warnings }, null, 2));
  console.log(`Done -> ${intake.out}  | verdict ${v} | ${wc} words | ${warnings.length} warning(s)`); warnings.forEach(w => console.log(" ! " + w));
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
