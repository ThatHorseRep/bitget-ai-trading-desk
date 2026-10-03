import type { DecisionVerdict } from "../../domain/decision/types";

/**
 * Section 7 of the decision artifact ("Actionable change conditions") used to
 * hardcode a `to PROCEED` target next to the live verdict badge, which rendered
 * "change the verdict from PROCEED to PROCEED" for every PROCEED artifact and
 * asserted a target the policy never computes. The engine's own change
 * conditions name a target verdict only when a condition literally names one
 * (e.g. a thesis invalidation condition that says "...would flip this to
 * PROCEED"); otherwise they describe *what* to do, not which verdict to reach
 * ("Monitor underlying assumptions for structural invalidation.").
 *
 * So the transition is rendered only when the conditions genuinely name exactly
 * one different verdict, and is otherwise dropped rather than guessed.
 */

/** Shared lead-in for the section 7 header. */
export const SECTION_SEVEN_LEAD =
  "The observable triggers that would materially change the verdict from";

/**
 * Verdict names are rendered in caps everywhere in this product (badge labels,
 * `WAIT: OFF-HOURS BASIS AND LIQUIDITY RISK` titles, the tolerance narration).
 * Matching is deliberately case-sensitive so ordinary prose verbs in engine
 * conditions — "Wait for market open to resolve elevated risk.",
 * "Reduce position size to lower risk band." — are never mistaken for a named
 * verdict.
 */
const VERDICT_TOKEN = /\b(PROCEED|WAIT|REDUCE|REJECT)\b/g;

export interface SectionSevenHeading {
  /** Static lead-in rendered before the current-verdict badge. */
  lead: string;
  /**
   * The verdict the change conditions actually name, or null when they do not
   * name exactly one different verdict.
   */
  targetVerdict: DecisionVerdict | null;
  /** Full header as plain text, e.g. "...change the verdict from PROCEED:". */
  text: string;
}

/**
 * The verdict named by the change conditions, or null.
 *
 * Returns null when the conditions name no verdict, name the verdict already
 * displayed (a "from PROCEED to PROCEED" transition is meaningless), or name
 * several different verdicts (no single target to claim).
 */
export function namedTargetVerdict(
  verdict: DecisionVerdict,
  changeConditions: readonly string[]
): DecisionVerdict | null {
  const named = new Set<DecisionVerdict>();
  for (const condition of changeConditions) {
    for (const match of condition.matchAll(VERDICT_TOKEN)) {
      named.add(match[1] as DecisionVerdict);
    }
  }
  if (named.size !== 1) return null;
  const only = [...named][0];
  return only === verdict ? null : only;
}

/** Build the section 7 header for a decision and its change conditions. */
export function sectionSevenHeading(
  verdict: DecisionVerdict,
  changeConditions: readonly string[]
): SectionSevenHeading {
  const targetVerdict = namedTargetVerdict(verdict, changeConditions);
  const text = targetVerdict
    ? `${SECTION_SEVEN_LEAD} ${verdict} to ${targetVerdict}:`
    : `${SECTION_SEVEN_LEAD} ${verdict}:`;
  return { lead: SECTION_SEVEN_LEAD, targetVerdict, text };
}
