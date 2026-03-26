When a Pokemon has a trait that modifies a skill, the Skills section of its species file must show the full formula inline:

```
Skill : Base + Trait Name (+X) = Total
```

For example, a Pokemon with [[cute|Cute]] must show `Charm : +0 + Cute (+5) = +5`, not just `Charm : +0`. If multiple traits modify the same skill, chain them: `Charm : +0 + Cute (+5) + Diamond Dust (+3) = +8`.

This convention makes trait contributions visible at a glance without cross-referencing trait definitions. It also surfaces errors -- if a trait bonus is missing from the skill line, reviewers catch it immediately.

If no traits modify a skill, just list the base value (e.g. `Charm : +0`).

## See also

- [[skill-traits-must-gate-behaviors]] -- the design principle behind why traits modify skills
- [[cute]] -- the canonical example of a skill-modifying trait (+5 Charm)
- [[skill-modifiers-from-traits-or-circumstance]]
