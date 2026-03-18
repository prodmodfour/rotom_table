# Encounter Library Search Filters Templates by Name Description Tags

The search textbox on the [[encounter-library-page]] and in the [[encounter-load-from-template-modal]] filters templates by matching the search query (case-insensitive) against three fields: template name, description, and tags.

Typing a query immediately filters the displayed templates — no submit button is needed.

The category dropdown provides an additional filter dimension, currently offering "All Categories" and "Wild Battle" as options. Categories are derived from the templates themselves.

Filtering and sorting are performed [[encounter-library-store-manages-client-state|client-side in the store's `filteredTemplates` getter]] after all templates have been fetched.
