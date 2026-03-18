The file `app/constants/environmentPresets.ts` defines four built-in environment presets as `BUILT_IN_PRESETS`. Each preset has a description and an `effects` array with typed entries.

**Dim Cave** — Blindness: -6 accuracy penalty (PTU p.1699), negated by Darkvision. Effects: `accuracy_penalty` (-6, negated by Darkvision) and a `custom` rule about light sources and Illuminate ability.

**Dark Cave** — Total Blindness: -10 accuracy penalty (PTU p.1716), negated by Blindsense. No map awareness, no Priority/Interrupt moves. Effects: `accuracy_penalty` (-10, negated by Blindsense) and a `custom` rule.

**Frozen Lake** — Weight class 5+ breaks ice, all ice is Slow Terrain, Acrobatics check DC 10 on injury. Effects: `terrain_override` and `status_trigger` (water entry causes hail-equivalent damage, Speed -1 CS).

**Hazard Factory** — Freeform GM-defined hazards. Effects: three `custom` rules for Machinery Damage Zones (DB 5-10), Electric Hazards (+5 DB to Water/Steel types), and Interactive Elements (levers, conveyor belts, pressure plates).

The [[encounter-environment-section]] dropdown lists these presets plus "Custom..." for freeform entry. The [[environment-preset-effects-display]] shows how effects render in the encounter UI.
