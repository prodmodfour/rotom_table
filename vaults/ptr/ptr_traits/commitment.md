# Commitment [Move] [X] [Y] [Z]

## Properties
	- Category: Innate
	- Activation: Passive / Triggered (Involuntary)
	- Energy Cost: 0

## Effect

The user is committed to mastering a specific damaging move. This move is determined randomly at birth from all damaging moves the species can learn and is unique to the individual, not the species.

**Move Enhancement (Passive):** When the user uses its Committed move, the move gains +X Damage Base and -Y AC (more accurate).

**Compulsion (Triggered, Involuntary):** After Z turns in combat without using the Committed move, the user must use it on its next turn. If the user has not unlocked the Committed move, it attempts the move and fails, wasting the turn.

This compulsion can be suppressed for one use with a DC 10 + X + Y - Z social check, modified by the Pokemon's [[pokemon-social-skill-hierarchy|social skill hierarchy]]. If you fail this check, you cannot try again until the next compulsion triggers.

**Starting Values:** X = 0, Y = 0, Z = 1.

**Species-Determined Exceptions:** In rare cases, a species' biology is so tightly linked to a specific technique that the Commitment move is fixed for the entire species rather than randomly determined. These species list the move by name in their Commitment trait (e.g. `Commitment [Poison Jab] [0] [0] [1]`). The move still functions identically — it simply isn't rolled at birth.

## Training X and Y

X and Y are trained separately through [[training-dual-check-system|training sessions]]:

- Pokemon Test: DC 15 + X + Y Combat
- Trainer Test: DC 15

Each successful training session increases either X or Y by 1 (trainer's choice).

## Unlock Conditions


## Styling

The correct format is `Commitment [Move] [X] [Y] [Z]` where Move is the move name and X, Y, Z are numbers. Each parameter gets its own brackets. Do not omit the brackets (e.g. `Commitment Close Combat 2 1 1` is incorrect).

## Notes

Commitment is the Fighting type's identity trait. Where other types express their identity through elemental control (Manipulation traits) or behavioral tendencies ([[instinct-traits]]), Fighting types are defined by total dedication to a single technique.

The power/control tension is central to the design. As X and Y grow through training, the Committed move becomes devastating — but the compulsion DC also climbs. A powerful committed fighter becomes harder to control. Training [[restraint]] (which increases Z) is the counterbalance: discipline over impulse.

This is why Psychic beats Fighting — mental domination is devastating against a creature compelled to commit to a predictable action. And why Fighting beats Dark — disciplined commitment can't be tricked out of its trained response.

## See also

- [[restraint]] — learnable trait that increases Z
- [[instinct-traits]] — Commitment's compulsion follows the instinct trait pattern
- [[type-identity-traits]] — Fighting's entry in the identity trait table
- [[commitment-represents-fighting-typing]] — why total dedication defines the Fighting type
- [[croagunk-line-poison-sac-system]] — species-determined Commitment (Poison Jab) driven by poison delivery biology
