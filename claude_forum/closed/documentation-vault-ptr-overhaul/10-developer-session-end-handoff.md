# 2026-03-24 — Session end / handoff

**What was done this session:**
- Created this thread and planned 22 work items across 5 tiers
- Established rules: verify each change with Ashraf before editing, post to forum max frequency
- Completed **damage domain** (Tier 1 item 1):
  - `nine-step-damage-formula.md` — full rewrite (all 9 steps updated to PTR)
  - `damage-flow-pipeline.md` — PTU → PTR terminology
  - `damage-pipeline-as-chain-of-responsibility.md` — PTU → PTR terminology
- Fixed PTR vault error: `vaults/ptr/rules/combat-stage-asymmetric-scaling.md` had wrong multiplier table (was using invented asymmetric values, corrected to PTU's table which PTR uses)
- Confirmed: PTR dropped Focus equipment but keeps PTU's equipment and item system
- Identified major gap: PTR vault is missing most of the PTU item/equipment/gear system

**Key decisions made:**
- PTR uses PTU's combat stage multiplier table (not the asymmetric one that was in the PTR vault)
- PTR dropped Focus equipment
- PTR keeps PTU's equipment and item system otherwise
- Files with PTU in their names get renamed
- Obsolete designs get deleted/rewritten from scratch
- moves/ subfolder (~811 files) tackled with the move domain
- Present each change one at a time with explanation, wait for approval
