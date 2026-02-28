---
id: decree-need-036
title: "Evolution move learning for stone evolutions with no minimum level?"
priority: P1
severity: MEDIUM
domain: pokemon-lifecycle
source: design-pokemon-evolution-001/spec-p1.md (section 2.2)
created_by: slave-collector (plan-20260228-173500)
---

# decree-need-036: Stone Evolution Move Learning

## Ambiguity

PTU says upon evolution, Pokemon learn moves "at a Level lower than their minimum Level for Evolution." For stone-based evolutions (e.g., Eevee -> Vaporeon with Water Stone), there is no minimum level — the stone can be used at any level.

## Interpretations

1. **All moves at or below current level (design default):** Since there's no minimum level, offer all moves from the new form's learnset that are at or below the Pokemon's current level and weren't in the old form's learnset.
2. **No moves:** Since there's no "minimum level for evolution," the formula "moves at a Level lower than minimum" returns nothing (no minimum = no eligible moves).
3. **All moves regardless of level:** Stone evolutions grant access to the entire new learnset since the trigger has no level gate.

## Impact

Interpretation 1 means stone evolutions at higher levels get more moves. Interpretation 2 means stone evolutions get no automatic moves (must learn via TM/tutor). Interpretation 3 is the most generous.

## Blocking

Blocks implementation of evolution move learning in feature-006 (Pokemon Evolution System, P1 tier).
