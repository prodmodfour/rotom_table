# Single Source of Truth

A design principle: every piece of knowledge in the system should have one authoritative representation. When data is duplicated across locations, the copies can diverge — and when they do, neither is reliably correct.

In this project, the PTR vault is the single source of truth for game rules. The app's constants files, database seeds, and hardcoded formulas are derived representations that should not independently define game data. When they do, the app can silently diverge from the rules it claims to implement.

## See also

- [[vault-sourced-data-repository]] — a destructive proposal to enforce single-source-of-truth by compiling app data directly from the vault
- [[hardcoded-game-rule-proliferation]] — the current state where rules are scattered across code, violating this principle
- [[duplicate-code-smell]] — the code-level symptom of the same problem