# Encounter Template Load Deep Links via Query Param

When loading a template from the [[encounter-library-page]], the confirmation navigates to `/gm?loadTemplate=<id>` rather than calling the load API directly.

The GM index page (`app/pages/gm/index.vue`) checks for a `loadTemplate` query parameter on mount. If present, it calls `encounterStore.loadFromTemplate(id)` to [[encounter-template-load-endpoint-generates-pokemon|create the encounter from the template]], then initializes the undo/redo history.

This mechanism bridges the library page (at `/gm/encounters`) and the GM encounter page (at `/gm`) using a standard URL query parameter as a cross-page action trigger.

## See also

- [[encounter-library-load-confirmation-modal]] — the UI that triggers this navigation
- [[encounter-load-from-template-modal]] — the alternative load flow that stays on the same page
