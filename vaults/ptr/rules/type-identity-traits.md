Most types have an identity trait -- a trait that any Pokemon of that type should have unless there is an explicit reason to omit it. These traits represent the innate capabilities that the typing itself confers -- a Fire type can manipulate fire, a Ghost can phase through walls, a Dark type exploits openings.

Identity traits are not exclusively distributed to the type they embody. Other Pokemon can have reasons to have an identity trait without being that type. A Normal-type [[Raticate]] can have [[opportunist|Opportunist]] because it fights dirty, even though Opportunist is the Dark identity trait. The type→trait mapping tells you what to *expect*, not what to *enforce*.

When designing or reviewing a species, check this list. If a Pokemon's type appears here and the trait is missing, there should be a reason.

## Elemental Manipulation Family

These traits all follow the same pattern: passive Struggle type modification + active ambient control scaling with potency X.

| Type | Identity Trait | Struggle Type |
| ---- | -------------- | ------------- |
| Flying | [[wind-manipulation]] | Flying |
| Water | [[water-manipulation]] | Water |
| Fire | [[fire-manipulation]] | Fire |
| Ground | [[earth-manipulation]] | Ground |
| Ice | [[ice-manipulation]] | Ice |
| Grass | [[plant-manipulation]] | Grass |
| Electric | [[electricity-manipulation]] | Electric |
| Rock | [[rock-manipulation]] | Rock |
| Fairy | [[light-manipulation]] | Fairy |
| Psychic | [[mind-manipulation]] | Psychic |

## Non-Manipulation Identity Traits

These types have identity traits that don't follow the Manipulation pattern.

| Type | Identity Trait(s) | Notes |
| ---- | ----------------- | ----- |
| Dark | [[opportunist]] | Grants Dark Struggle + extra AoOs. See [[opportunist-represents-dark-typing]]. |
| Ghost | [[phaser]] + [[intangibility]] | Phase movement + untargetability. No Struggle modifier. See [[phaser-intangibility-represent-ghost-typing]]. |
| Poison | [[poison-coated-natural-weapon]] + [[poison-expulsion]] | Poison Coated is universal; Poison Expulsion (Struggle modifier) only on ranged-toxin species. See [[poison-expulsion-represents-poison-typing]]. |
| Psychic | [[telekinetic]] (+ Mind Manipulation above) | Object manipulation via psychic force. See [[mind-manipulation-telekinetic-represent-psychic-typing]]. |
| Steel | [[shell]] | Flat damage reduction from armored body. Not all Steel types are equally armored, so X varies. |
| Bug | [[instinct-traits]] (tendency) | Not a single trait. Bug types are defined by having more instinct traits at higher values. See [[instinct-traits-represent-bug-typing]]. |
| Fighting | [[commitment]] | Total dedication to mastering one move. Compulsion to use it (instinct trait). See [[commitment-represents-fighting-typing]]. |

## Types Without Identity Traits

- **Normal** — Normal's identity is its lack of anything special. No type-specific capability to express.
- **Dragon** — Dragon's identity is expressed through exceptionally powerful moves exclusive to Dragon types, not through a trait.

## Design Notes

- The Manipulation family is straightforward: trait name matches type name. No individual design notes are needed for these -- the pattern is self-evident.
- Non-obvious mappings have individual design notes explaining why the trait represents the type.
- Dual-typed Pokemon may have identity traits from both types. When traits conflict (e.g. two different Struggle modifiers), use the primary type's trait.

## See also

- [[wind-manipulation-represents-flying-typing]]
- [[light-manipulation-represents-fairy-typing]]
- [[opportunist-represents-dark-typing]]
- [[phaser-intangibility-represent-ghost-typing]]
- [[mind-manipulation-telekinetic-represent-psychic-typing]]
- [[poison-expulsion-represents-poison-typing]]
- [[instinct-traits-represent-bug-typing]]
- [[commitment-represents-fighting-typing]]
- [[trait_philosophy]]
