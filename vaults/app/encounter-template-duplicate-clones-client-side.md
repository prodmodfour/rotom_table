# Encounter Template Duplicate Clones Client Side

The duplicate action in the [[encounter-library-store-manages-client-state|encounter library store]] works entirely on the client side. There is no dedicated server endpoint for duplication.

The store reads the original template from its local state, clones all data fields (description, battleType, combatants, gridConfig, category, tags), appends " (Copy)" to the name, and calls the standard `createTemplate` action to POST the clone as a new template.

This is the implementation behind [[encounter-template-duplicate-is-instant]].
