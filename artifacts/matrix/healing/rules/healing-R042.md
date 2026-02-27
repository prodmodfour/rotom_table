---
rule_id: healing-R042
name: Action Points — Scene Refresh and Drain/Bind
category: workflow
scope: cross-domain-ref
domain: healing
---

## healing-R042: Action Points — Scene Refresh and Drain/Bind

- **Category:** workflow
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Dependencies:** healing-R003, healing-R006, healing-R018
- **Errata:** false

---

## Cross-Domain References

### Persistent Status Afflictions (combat domain)
Burn, Freeze, Paralysis, Poison, Sleep — their tick damage mechanics and save checks are combat-domain rules. Healing interacts with them via Extended Rest curing (healing-R032), Pokémon Center curing (healing-R026), and items (healing-R040).

### Volatile Status Afflictions (combat domain)
Confusion, Rage, Curse, Infatuation, etc. — cured by Take a Breather (healing-R018) and at end of encounter. Full extraction in combat domain.

### Medic Class Features (errata / character-lifecycle domain)
The errata introduces the Medic class with healing-related features (Front Line Healer, Medical Techniques, Proper Care, Stay With Us). These are character-build options that modify healing mechanics. Full extraction belongs in the character-lifecycle domain.

### First Aid Kit (gear / cross-domain)
"Required to use the First Aid Expertise Feature. By Draining 1 AP, any Trainer can make a Medicine Education Check on a target as an Extended Action. The target gains Hit Points equal to the result, and is cured of Burn, Poison, and Paralysis." (`core/09-gear-and-items.md`)

### First Aid Expertise Feature (character-lifecycle domain)
"Daily x3 – Extended Action. Target: Pokemon or Trainers. Effect: The target may remove one Injury, has all Hit Points restored, and is cured of all Status Afflictions. You may use First Aid Expertise only once per day per target." (`core/03-skills-edges-and-features.md`)

### Walk It Off Feature (character-lifecycle domain)
"Daily – Extended Action. Effect: Remove one Injury from yourself and regain 1/4th of your maximum Hit Points. This Injury removal doesn't count against the natural healing limit on Injuries each day." (`core/03-skills-edges-and-features.md`)

### Medic Training Edge (character-lifecycle domain)
"Prerequisites: Novice Medicine Education. Effect: When you use Restorative Items on others, they do not forfeit their next turn." (`core/03-skills-edges-and-features.md`)

### Nurse Feature (errata — character-lifecycle domain)
"Drain 2 AP – Free Action. Trigger: You take an Extended Rest. Effect: During this Extended Rest, Pokémon and Trainers in your care... heal 1/8th of their Max Hit Points per half hour of rest instead of 1/16th (does not stack with Bandages). If the Extended Rest lasts at least 6 hours, they may remove 1 Injury." (`errata-2.md`)

### Suffocation Injuries (combat domain)
"Take 1 Injury per round suffocating. These injuries can't be healed by anything except breathing; once the target can breathe again, they are healed of these injuries." (`core/07-combat.md`)

### Falling Injuries (combat domain)
"In addition to the damage, trainers and Pokémon that fall 4 or more meters take 1 injury for every 2 meters fallen." (`core/07-combat.md`)

---

## Verification Checklist

- [x] Every section of `core/07-combat.md` relevant to healing has been read (Resting p.252, Injuries p.250-251, Take a Breather p.245, Fainted p.248, Status Afflictions p.246-247)
- [x] Every section of `core/06-playing-the-game.md` relevant to healing has been read (Action Points p.221)
- [x] Every section of `core/09-gear-and-items.md` relevant to healing has been read (Medicines p.276, Bandages p.277)
- [x] Every section of `core/03-skills-edges-and-features.md` relevant to healing has been read (Medic Training, First Aid Expertise, Walk It Off)
- [x] Errata corrections have been applied (Medic class, Nurse, Bandage interactions)
- [x] No rule is orphaned (every non-foundation rule has dependencies)
- [x] No circular dependencies exist
- [x] Cross-domain references are noted but not fully extracted
- [x] Rule IDs are sequential with no gaps
- [x] Every entry has a direct quote from the rulebook
