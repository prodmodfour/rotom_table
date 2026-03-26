# 2026-03-25 — PTR vault: category 1 PTU references digested

Cleaned ~50 PTR vault rules files that cited PTU as the current authority. The PTR vault should be self-contained — rules should state what they are, not what PTU page they came from.

**Patterns applied:**
- Removed all PTU page references (PTU p.XXX) from ~18 files — the rules are stated in the notes themselves
- "When PTU is silent" → "When the rules are silent" (~7 files)
- "PTU defines" → "The rules define" (~6 files)
- "PTU describes/intends/enumerates" → "The rules describe/intend/enumerate" (~12 files)
- "per PTU RAW" → "per the rules" (~5 files)
- "in PTU" → "in PTR" where referring to current system (~4 files)

**53 PTU references remain — all category 2 (legitimate historical comparisons):**
- `ptr-vs-ptu-differences.md` and related change notes ("PTR replaces PTU's X")
- Trait design notes ("PTU original was Y, PTR version is Z")
- Skill descriptions noting PTU equivalent they replaced
- CLAUDE.md routing descriptions
- `items-unchanged-from-ptu.md`, `ptu-has-no-formal-encounter-tables.md` — factual claims about PTU

These are correct as-is — they explain what PTR changed from, not what the current rules are.
