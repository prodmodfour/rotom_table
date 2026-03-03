---
id: decree-need-043
title: "Should 'Bound' condition block Pokemon recall?"
priority: P3
status: open
domain: combat
source: code-review-308 MEDIUM-002 + rules-review-281 HIGH-001
created_by: slave-collector (plan-20260303-191515)
created_at: 2026-03-03
---

# decree-need-043: Should 'Bound' condition block Pokemon recall?

## Ambiguity

The switching system checks for both 'Trapped' and 'Bound' conditions when blocking recall. However:

1. **'Bound' is not in the StatusCondition type union** — it only passes via `as any` casts in tests
2. **PTU's "Bound" (Destiny Bond, p.367) is a revenge-faint mechanic**, not a movement/recall restriction
3. **No PTU text states Bound restricts movement or recall**

Both code-review-308 (code perspective) and rules-review-281 (rules perspective) independently flagged this as problematic.

## Question

Was 'Bound' intended as a house rule condition synonym for a Trapped-like restriction (e.g., from Grapple mechanics, Vortex moves, or a custom implementation)?

## Options

1. **'Bound' has no intended meaning** → Remove all 'Bound' checks from switching system, clean up `as any` casts
2. **'Bound' is a house rule condition** → Add to StatusCondition type union, document its semantics (what applies it, what it prevents)
3. **'Bound' should be renamed** → Perhaps it was meant to represent a specific PTU mechanic under a different name

## Affected Files

- `app/server/services/switching.service.ts` (validateSwitch, validateForcedSwitch)
- `app/composables/useSwitching.ts` (canForcedSwitch)
- `app/server/api/encounters/[id]/recall.post.ts` (recall validation)
- `app/tests/unit/services/switching.service.test.ts` (Bound test cases use `as any`)
