# Group View Combatant Card

`GroupCombatantCard.vue` renders a single combatant as a large horizontal card used in the [[group-view-encounter-tab]]. It displays a 120px sprite (240px at 4K), the combatant name, type badges for Pokemon, an HP bar, mount indicator, status conditions, and a turn indicator.

The current turn card scales up slightly (1.02, or 1.03 at 4K) with a scarlet border glow and gradient background. Fainted combatants render at 50% opacity with partial grayscale.

The HP bar shows exact values (`current/max`) when `showDetails` is true (player-side) and percentage when false (enemies). The bar uses four health tiers from the shared `useCombat` composable.

The mount indicator shows "Mounted on [partner]" or "Carrying [partner]" using the encounter store's `getMountPartner` to resolve the partner combatant's name.

The turn indicator is a pulsing scarlet arrow positioned to the left of the card, using a clip-path polygon shape with a 1-second pulse animation.

## See also

- [[group-view-initiative-tracker]] — uses a compact list layout instead of these large cards
- [[group-view-layout-optimized-for-tv]] — all dimensions double at 4K