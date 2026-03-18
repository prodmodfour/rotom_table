Same Type Attack Bonus (STAB) adds +2 to a move's Damage Base before rolling, not a multiplier to final damage. A DB6 Fire move used by a Fire-type becomes DB8. This is applied in step 3 of [[damage-formula-step-order]], before dice are rolled.

Because STAB modifies the Damage Base, it interacts with the DB-to-dice lookup table, potentially changing the entire dice expression. The app applies STAB by incrementing the DB value, then looking up the new dice expression.

## See also

- [[eighteen-pokemon-types]] — the type list that determines STAB eligibility
