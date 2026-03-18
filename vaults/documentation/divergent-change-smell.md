# Divergent Change

A [[change-preventer-smells|change preventer]] [[code-smells|smell]]. A single class must be modified in multiple unrelated ways when making a single logical change. For example, adding a new product type requires changing the methods for finding, displaying, and ordering products — all within one class.

This indicates the class handles too many concerns. The fix is to split it so each concern lives in its own class.

## See also

- [[single-responsibility-principle]] — divergent change is a direct symptom of SRP violations
- [[large-class-smell]] — large classes are especially prone to divergent change
- [[shotgun-surgery-smell]] — the inverse problem: one change scattered across many classes instead of many changes concentrated in one class
- [[combatant-service-mixed-domains]] — five independent change vectors in one service
- [[next-turn-route-business-logic]] — weather, turn, and death rule changes all modify one file
