# Encounter Table Components

UI components for encounter table management, all GM-only. Located in `components/encounter-table/`.

## TableEditor

Full editing interface for a single encounter table: name, description, level range, density tier, species entries (add/remove/edit weight and level), [[sub-habitat-modification-system|sub-habitat modifications]], and a generate button that invokes [[encounter-generation-service]].

## TableCard

Summary card for the table list view. Displays table name, entry count, and density. Used on the GM encounter tables page.

## EntryRow

Single species entry within a table: shows species name, weight, level range, encounter probability percentage (from [[resolved-entry-pool|getTotalWeight]]), and edit/delete controls.

## ModificationCard

Sub-habitat card displaying modification name, density multiplier, and its entries. Supports add/remove of modification entries.

## ImportTableModal

JSON file upload modal for table import. Invokes the [[encounter-table-store|importTable]] action and displays any warnings from the import.

## See also

- [[encounter-table-store]]
- [[encounter-component-categories]]
- [[gm-view-routes]]
