# Out-of-Turn Service Split

A potential [[extract-class]] to address the [[out-of-turn-service-bundled-actions|four action types bundled in out-of-turn.service.ts]].

## The idea

Split the 753-line service along mechanical boundaries:

| New service | Responsibility | ~Lines |
|---|---|---|
| `aoo.service.ts` | Attack of Opportunity eligibility, trigger detection, resolution | ~200 |
| `hold-action.service.ts` | Declare, release, queue management | ~100 |
| `priority-action.service.ts` | Standard, limited, advanced priority variants | ~150 |
| `interrupt-action.service.ts` | Eligibility, creation, usage tracking | ~100 |

The backward-compatibility re-exports from `intercept.service.ts` would be removed — callers would import directly.

The shared `OutOfTurnUsage` tracking struct would move to a shared types file or small utility.

## Principles improved

- [[single-responsibility-principle]] — each action type has its own module with one reason to change
- [[interface-segregation-principle]] — consumers needing only AoO don't pull in priority/hold/interrupt surface

## Trade-offs

- Four new files for one split. The [[service-inventory]] grows from 23 to 26 (net +3 after removing the unified service).
- Some encounters use multiple out-of-turn action types in combination — callers coordinating across services need more imports.
- The alternative is a lighter split: two services instead of four — `reactive-actions.service.ts` (AoO + Interrupt, both triggered by opponents) and `proactive-actions.service.ts` (Hold + Priority, both chosen by the actor).

## Open questions

- Four services or two? The two-service split (reactive/proactive) may strike a better balance between SRP and file proliferation.
- The Struggle attack stats function (lines 700-730) is unrelated to any of the four action types — where should it live?
- Does removing the backward-compat re-exports break any existing import paths? How many call sites need updating?
- The circular dependency between `out-of-turn.service.ts` and `intercept.service.ts` (through the re-exports) would be resolved by the split — is this a strong motivator?

## See also

- [[intercept-disengage-system]] — the intercept service, currently re-exported from out-of-turn, would become independent
- [[trigger-validation-switch-chains]] — an OCP concern within the AoO portion of this service
