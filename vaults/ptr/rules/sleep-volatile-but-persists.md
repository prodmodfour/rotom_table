Sleep is categorized as volatile (per PTU p.247 structural placement) but does NOT clear on recall or encounter end. This matches mainline Pokemon video game behavior where Sleep persists through switching and battle end.

Sleep is cured only by its normal wake-up mechanics (save checks, taking damage, items, Pokemon Center). The p.246 mention alongside Frozen is a behavioral note, not a reclassification.

This is the motivating example for [[decouple-behaviors-from-categories]] — the old `RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS]` pattern made this impossible.

## See also

- [[condition-independent-behavior-flags]]
- [[confused-three-outcome-save]]
- [[sleep-wakes-on-damage-not-hp-loss]]
