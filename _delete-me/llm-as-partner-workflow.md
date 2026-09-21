# Skill: LLM-as-Partner Design Workflow

## What problem it solves
Using AI in design without producing generic, averaged output.
The core insight: the model has the average of everyone else's taste. You supply the taste. The model supplies the speed.

## The posture shift
> **You are not the model's user. You are its creative director.**

Wrong: *"Design me a landing page for my SaaS."* → median output
Right: bring taste, bring rejections, bring references → the model executes

## The 7-step workflow

### 1. Lock brand DNA first
Use a fresh model (different from your build session — no context contamination).
Run the Chief Brand Designer prompt (see appendix below).
Fine-tune until it matches your vision.

### 2. Get visuals before building
Prompt for what imagery could represent the product/brand (not actual images — concepts).
Take the list to Pinterest or any image platform.
Goal: find what you didn't know you needed. Then build.

### 3. Bring a rejection list, not a request list
Know what you DON'T want before opening the chat.
The model can't read taste. But it can obey "no."

Common rejections to establish:
- No gradient text
- No `scale-1.02` hover (buttons shrink, never grow)
- No image overlays
- No pure white / pure black
- No exclamation marks
- No "seamless / robust / empower / unlock / supercharge"
- No three-column feature grids

### 4. Bring references, not prompts
Instead of *"design me a hero"* →
*"build me a hero that feels like Linear's pricing page crossed with Apartamento magazine. Flush-left to viewport edge, not centered."*

References force specificity. Specificity forces the model out of the average.

### 5. Review like a creative director
Run 4-6 iterations per section. Nothing ships on first pass.
Delete, move, cut copy in half, cut again.
**The model is rendering. You are designing.**

### 6. Write the copy yourself
AI copy has a smell — "seamless," "robust," "empower."
Write every word. Then give the model: *"lay this out."*
If you let the model write words, the brand has no voice. It has the average voice.

### 7. Keep a system
After the project: write a `DESIGN_SYSTEM.md` and/or `LANDING_PAGE_PLAYBOOK.md`.
Color tokens, type scale, button laws, tone bible, rejection list.
One paragraph you paste into any new chat loads your entire taste system.
**The system is the moat. Anyone can prompt. Few people can codify what good looks like.**

## The unexpected benefit
Articulating *why* something is wrong forces you to name the principle.
Named principles become owned taste.
The friction of explaining to the model sharpens your vocabulary for your own aesthetic.

## The warning
AI is a force multiplier. Multiplying strong taste by AI = distinctive work, fast.
Multiplying no taste by AI = generic work, fast.
The fix isn't to stop using AI. The fix is to build the taste first.

## Appendix — Chief Brand Designer prompt
```
You are now my Chief Brand Designer, Creative Director, UX Strategist, and Visual Systems Partner.

Whenever I give you a hackathon idea, your job is to help me brainstorm and design a complete brand identity, mascot, visual experience, and user experience around it.

Think like a mix of:
- a premium startup brand designer
- a product designer
- a hackathon storyteller
- a mascot/character designer
- a web3/AI product strategist
- a pitch deck creative director

For every brand idea I give you, help me develop:

1. Brand Strategy — name ideas, taglines, positioning, personality, emotional hook
2. Visual Identity — logo direction, palette, typography, icon style, layout system
3. Mascot / Character System — concept, personality, shape language, poses, product usage
4. Product UX — landing page structure, dashboard layout, onboarding, key screens, microcopy
5. Visual Experience — hero concept, animations, card designs, social graphics, pitch deck direction
6. Hackathon Presentation — pitch story, demo narrative, judge-friendly explanation, slide direction

Style rules:
- Avoid generic AI-looking branding
- Avoid overcomplicated logos
- Make everything intentional, clean, memorable
- Prioritize what can be built quickly during a hackathon
- Give strong opinions, not vague options
- When something is weak, say so and improve it
- Think: premium, minimal, expressive, demo-ready
- Always explain reasoning behind each design choice
- Give practical design prompts for image gen, Figma, landing pages, pitch decks

Respond in this format:
A. Brand Core | B. Naming Options | C. Recommended Brand Direction | D. Logo Direction |
E. Color + Typography System | F. Mascot Concept | G. Product UX Flow |
H. Landing Page Direction | I. Pitch Deck Visual Direction |
J. Image Generation Prompts | K. Final Creative Recommendation
```
