A Pokemon can know at most 6 moves at any time. This limit is enforced by the [[learn-move-api]], which rejects additions when the current count is 6 and no `replaceIndex` is provided.

The [[move-learning-panel]] displays all 6 slots and switches from "Add to Slot" to "Replace a Move" mode when all slots are occupied.

The [[pokemon-generator-service]] also respects this limit by taking only the last 6 entries from the species learnset at or below the Pokemon's level via `.slice(-6)`.
