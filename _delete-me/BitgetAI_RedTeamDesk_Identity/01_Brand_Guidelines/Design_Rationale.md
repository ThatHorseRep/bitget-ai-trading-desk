# Bitget AI RedTeam Desk — Design Rationale

---

## 1. What the brief actually was

The starting material was not a pitch. It was a working Next.js application with a
research dossier attached: a deterministic risk engine, an LLM confined to qualitative
reasoning, and a four-state decision policy already committed to code. The brand had to
serve a product that exists, entering a competition judged — in Track 3 — on pure
subjective assessment, with "LUI fluency" named explicitly in the criteria.

That produced three constraints that shaped every decision:

1. **The identity has to run inside the product**, not sit beside it in a deck.
   Anything that could not be rendered by the app at 16px was out.
2. **It has to survive a judge's first three seconds.** Track 3 scoring is subjective
   and the field will be full of dashboards. Distinctiveness is worth points.
3. **It must not overclaim.** This is a tool that tells traders *no*. A brand that
   looks like a hype token would contradict the product's only real asset — restraint.

---

## 2. The central idea: the mark carries the metric

Most fintech marks are decorative — a shield, an upward arrow, a stylised initial. They
say "finance" and then stop. The stronger move here was available because the product
has a genuinely unusual core fact.

Tokenized US equities keep trading for **65.5 hours a week** after NYSE and Nasdaq
close. Over that window, the token drifts away from the asset it is supposed to track.
Basis un-anchoring is the product's whole reason to exist.

So the mark *is* that event.

> An octagonal token, cut by a fault plane at −12°, with the two halves displaced along
> it. The gap is the basis gap.

The octagon was chosen over the obvious shield. A shield reads "antivirus" and appears
in a thousand security logos; an octagon reads **seal, medallion, machined plate** — and
carries a quiet nod to the *token* being examined. The chamfered geometry also gives a
silhouette that survives at favicon size, which a heraldic shield does not.

### Why this matters more than it first appears

Displacement is a **parameter**, not a drawing. The same construction, run at different
offsets, generates the entire verdict set:

| Verdict | Displacement | Meaning |
|---|---|---|
| `PROCEED` | 0u | The token is whole. Thesis and position both survive. |
| `REDUCE` | 4.5u | Visible slip. Survives only at smaller size. |
| `WAIT` | 9u | Displaced, seam dashed. Inputs degraded; do not act yet. |
| `REJECT` | 15u | The halves have clearly parted. Do not deploy capital. |

These map one-to-one onto `Decision.verdict` in `src/core/decision/policy.ts`. Nothing
was invented to fill out the set.

The consequence is the part worth paying for: **a user who learns the scale inside the
product reads the logo differently outside it.** The brand mark sits at the 9u reference
cut. Once you know that 15u means reject and 0u means proceed, the logo stops being a
logo and becomes a reading. Very few identities can do that, and it is only possible
because the product had a real metric to hang it on.

---

## 3. Colour strategy: red is a verdict, not a decoration

Every crypto interface on earth spends red on falling numbers. Red is so cheap in this
category that it has stopped carrying information.

The system rations it to exactly two places:

- the fault in the mark
- the `REJECT` verdict

Nothing else. Not links, not hover states, not focus rings, not emphasis, not error
toasts. **If red is on screen, something failed.**

This is a positioning argument disguised as a colour rule. The product's differentiator
is that it will tell you not to trade. Making the refusal the only red surface in the
system means the brand's scarcest visual resource is spent on the one thing competitors
will not say.

| Token | Hex | Role |
|---|---|---|
| Blueprint Navy | `#0E2436` | Primary structure, body of the mark |
| Stamp Red | `#C8102E` | The fault, and REJECT. Reserved. |
| Proof Gray | `#E7E9E6` | The ground |
| Deep Field | `#06121C` | App chrome, night applications |
| Steel | `#54697E` | Rules, axes, secondary type, WAIT |

Two deliberate avoidances. The ground is a **cool** report gray, not the warm cream that
has become a house style across AI-generated brand work. And the red is a printed
stamp/ink red — the colour of an auditor's rejection mark — rather than the orange-lean
vermilion that reads as a default accent.

`PROCEED` teal (`#0E9F8B`) is tuned to sit beside Bitget's cyan-teal without imitating
it, so co-branded material stays harmonious while the desk keeps its own voice.

---

## 4. Typography: the sans speaks, the mono computes

Geist Sans and Geist Mono are **already installed in the repository**. Choosing them
means zero adoption cost, no licensing exposure, and no web-font flash on first paint.
Reaching for a fashionable display face would have introduced all three.

But the choice is not merely pragmatic. The split is doing argumentative work:

- **Sans** — the endorser line, all prose. This is the platform talking.
- **Mono** — the product name, every verdict, every figure. This is the engine reporting.

The wordmark is set in the **mono**, which is unusual in fintech and therefore ownable.
The justification is the product's own central claim: the LLM never touches a number.
Monospace is the typography of computed output and of test instrumentation. Setting the
name in it makes the promise before a single word of copy is read.

The rule extends into the product: `.rtd-figure` sets tabular mono for anything the
deterministic engine produced. The face becomes the evidence.

### One piece of proprietary type

The brand line is **Thesis ≠ Position** — a phrase that was already in the repository's
own submission draft, so it is the founder's language, not an agency invention.

Neither Geist face carries U+2260. Rather than substitute the phrase, the identity draws
its own glyph: the bars take the text colour, and the stroke that breaks the equality is
always Stamp Red. The most-repeated element in the brand is therefore custom, and the
red does the severing — consistent with the colour rule.

---

## 5. The fault device, and the rule discovered by breaking it

The fault leaves the mark and becomes a layout device: a short red rule at −12°, used to
close a text block.

It has a **defined length**. The first round of applications used it as a full-bleed
sweep, which failed on three separate pieces — at −12°, a line crossing a 1,260px
billboard drops 268px vertically and inevitably runs through the headline. The result
read as a strike-through: layouts that appeared to cancel their own message.

That became a standard: **the fault device never crosses type.** It is a signature, not
a slash.

The second device is the **overhang rule** — 168 hours drawn as a bar with 65.5 of them
shaded. It is the product's central fact rendered as data, and it can carry a slide, a
billboard or an A-board on its own without a word of persuasion.

---

## 6. Market positioning

The competitive field the repo's own teardown identifies — Bloomberg ASKB, FinChat,
Koyfin — shares a visual register: dense, blue, institutional, reassuring. They sell
*more information*.

This product sells *less action*. It is the thing that argues with you.

The identity positions accordingly:

- **Against the incumbents:** the research-document register (proof stock, mono figures,
  measured rules, construction drawings) claims the same seriousness without the
  terminal-screen density. It looks like a lab report, not a dashboard.
- **Against the hackathon field:** most Track 3 entries will present as chat UIs in a
  dark theme with a gradient. A computed, geometric, near-monochrome system with a
  single rationed red will not be mistaken for any of them.
- **Against the category's tone:** nothing in the system is optimistic. There are no
  upward arrows, no growth curves, no gradients. The brand's emotional claim is
  composure, which is the only credible claim for a tool whose best outcome is talking
  you out of a trade.

The endorsement lockup keeps `BITGET AI` in the sans above `REDTEAM DESK` in the mono.
The desk reads as a specialist instrument *within* an ecosystem rather than a competitor
to it — which is the correct relationship for a hackathon entry hoping for Playbook
productization or Demo Day follow-up.

---

## 7. Longevity

Every element is either pure geometry or a face already in the product. There are no
gradients in the mark, no depth, no blur, no 3D, no illustration style to date, and no
trend-dependent colour. The construction is defined by six numbers and reproduces
identically in Python, TypeScript, or on a plate.

The one thing that could age it — a decorative flourish — was deliberately not spent.
The boldness in this system is concentrated in a single place: the displacement. That is
also the only place it *should* be, because that displacement is the product's argument.

---

## 8. What was rejected along the way

Kept here because the discards explain the result.

- **A solid octagon.** Too heavy; read as a broken road sign. Opening a counter turned it
  into an instrument.
- **A shield silhouette.** Generic in the security category, and it collapsed at 16px.
- **Red as a stroke drawn *over* the mark.** Read as a prohibition slash and made the
  form look cancelled. Computing the seam as the exact gap between the displaced halves
  fixed it — the red is now the fault plane itself, not a line on top.
- **A −20° fault.** More energetic, but it pinched the counters and lengthened the seam
  past the point where small sizes held.
- **A full-bleed fault device.** Covered in §5.

---

*Bitget AI · RedTeam Desk · Identity v1.0*
