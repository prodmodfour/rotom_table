# Encounter Library Page

Accessed at `/gm/encounters` via the [[gm-navigation-bar]]. Displays saved encounter templates.

The page header shows "Encounter Library" with a count of templates (e.g. "8 templates") and a "+ New Template" button that opens the [[encounter-template-create-modal]].

Below the header are filter controls: [[encounter-library-search-filters-templates-by-name-description-tags]] and [[encounter-library-sort-controls]].

Templates appear as cards in a grid layout — see [[encounter-library-template-card-layout]] for the full card structure. Each card has [[encounter-template-card-actions]] (Load, Duplicate, Edit, Delete).

## See also

- [[encounter-no-active-state]] — the "Load from Template" and "Browse Library" links lead here
- [[encounter-toolbar]] — the "Save Template" button saves to this library
- [[encounter-load-from-template-modal]] — the modal version of browsing templates, accessible from the no-active-state page
- [[encounter-library-store-manages-client-state]] — the Pinia store that manages template state, filtering, and sorting
- [[encounter-template-api-endpoints]] — the REST endpoints that persist templates
