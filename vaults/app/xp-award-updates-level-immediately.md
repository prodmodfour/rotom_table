When a trainer XP award crosses the 10 XP threshold, the character's level and remaining XP update in the database immediately — before the [[trainer-level-up-modal]] is completed or even opened.

Behind the open modal, the [[gm-character-detail-identity-section]] already shows the new level, and the [[gm-character-detail-xp-section]] shows the remainder XP (e.g., 1 / 10 XP after going from 6 XP + 5 = 11, which is level 2 with 1 XP remaining).

The modal only handles allocation of the gains (stat points, edges, features, classes). [[trainer-level-up-cancel-discards-allocations|Cancelling the modal]] discards these allocations but does not revert the level. The [[trainer-level-up-fromLevel-race-guard]] ensures the modal calculates advancement correctly despite the level already being updated.
