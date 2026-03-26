When a condition's specific rules text contradicts what its category would imply, the specific text wins. Categories — volatile, persistent, other — are organizational conveniences for display and grouping. They are not mechanical authorities.

If a volatile condition's text says it persists through recall, that text overrides the general expectation that volatile conditions clear on recall. The app implements this through [[condition-independent-behavior-flags]]: each condition carries its own flags for clearing-on-recall, clearing-on-faint, and clearing-on-encounter-end, regardless of which category it belongs to.

This is why [[decouple-behaviors-from-categories]] exists as a design principle. The old pattern of deriving behavior from category (`RECALL_CLEARED = [...VOLATILE]`) broke the moment a single condition needed category-atypical behavior.

## See also

- [[decouple-behaviors-from-categories]] — the implementation principle that follows from specific-over-general
- [[condition-independent-behavior-flags]] — the per-condition flags that make this work
- [[status-condition-categories]] — the categories themselves, now used only for display
