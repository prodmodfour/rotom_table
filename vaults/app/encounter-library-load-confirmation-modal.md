# Encounter Library Load Confirmation Modal

Clicking "Load" on a template card in the [[encounter-library-page]] opens a confirmation modal titled "Load Template."

The modal body reads: `Load "[template name]" into a new encounter?` with the template name in bold, followed by a line stating the combatant count (e.g. "This will create a new encounter with 5 combatants.").

The footer has Cancel and "Load Template" buttons. Confirming creates a new active encounter from the template and navigates to the [[encounter-no-active-state]] replacement — the active encounter view at `/gm`.

This is a simpler flow than the [[encounter-load-from-template-modal]], which allows searching, browsing, and renaming before creating.

## See also

- [[encounter-template-load-deep-links-via-query-param]] — how the Load action navigates from the library page to the GM page
- [[encounter-template-load-endpoint-generates-pokemon]] — what happens server-side when the template is loaded
