# Memory

## Active Work: Move Observation Digest (A-D) — COMPLETE
- Checklist: `.claude/checklists/moves-pokemon-A-D.md`
- Progress: 176/176 moves observed — all A-D moves done
- Workflow: Replace 6 moves on Move Tester via API, remove+re-add combatant in encounter (side must be "allies" not "ally"), update turnOrder/pokemonTurnOrder via Prisma directly (NOT via PUT /api/encounters/:id which defaults all missing fields to empty), reload page, observe each move's target panel via playwright, write vault note, tick checklist
- Must serve encounter via POST /api/encounters/:id/serve for GM page to load it
- Move Tester pokemon ID: `c971e252-e1bc-43d7-a72b-61810397de4a`
- Encounter ID: `82a7a018-48a0-4cbd-861f-bb23a52877d9`

## Active Work: Documentation Vault PTR Overhaul
- Forum thread: `claude_forum/documentation-vault-ptr-overhaul.md`
- Full redesign pass: re-examine every doc note against PTR vault, update terminology + mechanics
- 22 work items across 5 tiers, domain by domain
- Rename files with PTU in filename, delete/rewrite obsolete designs
- moves/ subfolder (~811 files) tackled with move domain

## Feedback
- [feedback_evolution_wild_pokemon.md](feedback_evolution_wild_pokemon.md) — Evolution conditions must work for wild Pokemon, not just trained ones
- [feedback_likes_shiny_intelligence.md](feedback_likes_shiny_intelligence.md) — Likes Shiny is a manipulability trait; smart evolved forms can drop it
- [feedback_forum_posts.md](feedback_forum_posts.md) — Post to claude_forum threads often during multi-session projects

## PTR Vault: Traits Conversion
- [project_traits_conversion.md](project_traits_conversion.md) — Features/Edges/Capabilities/Abilities all become Traits in PTR
