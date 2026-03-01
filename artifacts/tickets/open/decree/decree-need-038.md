---
ticket: decree-need-038
priority: P3
status: open
source: rules-review-217 MEDIUM-001
created_by: slave-collector (plan-20260301-115518)
created_at: 2026-03-01
---

# decree-need-038: Does forced switch (Roar) override the Trapped condition?

## Ambiguity

PTU 1.05 p.247 states: "A Pokemon or Trainer that is Trapped cannot be recalled." No explicit exception exists for forced switches (Roar, Dragon Tail, Circle Throw).

The current implementation (feature-011 P1) allows Roar to force-switch a Trapped Pokemon, following video game precedent where Roar/Whirlwind break trapping effects.

## Options

1. **Roar overrides Trapped** — Forced switches bypass the Trapped condition entirely (video game precedent)
2. **Roar blocked by Trapped** — Trapped prevents all recall including forced switches (strict PTU RAW interpretation)
3. **Roar has its own check** — Use Roar's own accuracy roll to determine if it breaks through Trapped (hybrid ruling)

## Context

- PTU text: "A Pokemon or Trainer that is Trapped cannot be recalled" (p.247)
- decree-034 already rules: "Whirlwind is a push, not a forced switch" — so only Roar applies here
- Dragon Tail and Circle Throw are not yet addressed by any decree
- Current code: `useSwitching.ts` → forced switch mode bypasses Trapped validation

## Impact

Affects `useSwitching.ts` validation logic and `switch.post.ts` server-side validation. If ruling differs from current implementation, fix cycle needed.
