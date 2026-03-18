Bind appears in the [[encounter-act-modal-move-list]] as a beige (Normal-type) button showing "Bind Normal Static". The button is **disabled** with a tooltip reading "Static moves cannot be actively used".

Bind has no DB or AC values displayed. Its frequency is Static, meaning it is a passive ability that provides a constant bonus rather than an actively usable combat action. The move data lists it as Status class with range "--", and its effect grants a +1 bonus to Accuracy Rolls for Grapple Maneuvers and +2 to Skill Checks for Grapple Maneuvers or gaining Dominance.

This is the first observed move with the Static frequency. The app correctly prevents Static moves from being selected as combat actions by disabling the button and applying the `move-btn--exhausted` CSS class.

## See also

- [[encounter-act-modal-move-list]]
- [[move-frequency-type]] — Static as a passive frequency
- [[bide-move-in-combat]] — another move with unusual combat behavior
