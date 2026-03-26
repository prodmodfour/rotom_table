# 2026-03-26 — Functionality Catalog from Previous App

The previous app's implementation is being discarded. This catalog preserves the **functionality and UX behaviors** that must survive into the redesign. Organized by domain, not by view or component. Sourced from the app vault (~688 observations).

---

## Session Infrastructure

- **QR code connection.** GM's Connect panel shows LAN URLs with QR codes. Players scan with their phone, no accounts or passwords. Joining should be as frictionless as sitting down at the table.
- **WebSocket roles.** Three roles (gm, group, player) with role-based broadcast targeting. GM is single writer — all state mutations originate from GM, either from direct action or approved player requests.
- **Serve/Unserve.** GM explicitly pushes an encounter to the group and player views ("Serve to Group"). Unserving removes the encounter from all connected views. This gate controls when combat is visible on the TV.
- **GM controls the group view.** Lobby/Scene/Encounter/Map toggle buttons on the GM nav bar instantly switch what the TV shows. Players can request tab changes (with 30-second cooldown), GM approves/rejects.
- **Real-time sync.** All three views stay synchronized via WebSocket broadcasts after every GM mutation. Group view has polling fallback for missed messages.

## GM Navigation and Content Management

- **Persistent nav bar.** Always visible: Encounter, Encounters (library), Scenes, Habitats, Sheets (character library), Create, Map. Plus Connect button and group view tab toggles.
- **Character library.** List of all characters (trainers + Pokemon) with search. Cards link to detail pages.
- **Character detail page.** Tabbed view: Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes. Edit mode toggle for inline editing. XP section with grant and tracking.
- **Pokemon detail page.** Tabbed view: Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes. Edit mode toggle. Evolve button.
- **Character creation.** Two tracks: Human and Pokemon. Form-based creation flow.

## Encounter Lifecycle

- **Encounter creation.** From scratch (empty encounter + add combatants) or from scene (converts scene entities into combatants).
- **Add combatant modal.** Two tabs: Pokemon and Humans. Search box. Shows sprites, names, levels, types. Add to Players/Allies/Enemies columns.
- **Encounter templates.** Save current encounter as template. Load from template library. Templates store combatant snapshots. Duplicate, edit, delete. Search/sort/filter. List and grid view toggle.
- **Scene-to-encounter conversion.** "Start Encounter" from scene editor. Choose battle type (Full Contact or League) and significance (Insignificant/Everyday/Significant for XP multiplier). Wild Pokemon in the scene become full DB-backed enemies via generator service.
- **Encounter serving.** Explicit "Serve to Group" pushes to TV and player phones. "Unserve" removes from all views and ends the encounter.

## Combat Flow

- **Two battle types.** Full Contact (all combatants act in speed order) and League/Trainer (trainers declare first, then Pokemon act).
- **Declaration phase.** Lowest speed declares first. Action type dropdown + description text. "Declare & Next" advances through declarers.
- **Resolution phase.** Highest initiative resolves first. Current turn combatant highlighted with green border.
- **Priority actions.** Between each phase, a panel offers every combatant three priority options: Full Turn, Limited, Advanced. "No Priority — Continue" skips.
- **Combat log.** Running record of actions taken.
- **Undo/Redo.** Toolbar buttons for reversing GM actions.
- **Keyboard shortcuts.** Comprehensive shortcut dialog (Ctrl+Z undo, grid navigation, VTT tools, selection, AoE tools, fog/terrain tools).

## Combatant Card and Actions

- **Combatant card.** Avatar/sprite, name, level, HP bar (color-coded: green >50%, yellow 25-50%, red <25%), initiative value. Current turn card gets green border highlight.
- **HP controls.** Spinbutton + "-HP" button with damage type selector. Spinbutton + "+HP" button. Immediate visual feedback.
- **Action buttons per combatant.** +T (temp HP), CS (combat stages modal), ST (status conditions modal), Item (use item modal), Act (act modal), Switch, Force Switch (GM override), Remove.
- **Act modal.** Header with avatar, name, types, action economy display (Standard/Shift counters). Move list with type-colored buttons. Selecting a move opens target panel. Standard actions: Shift, Struggle, Pass Turn. Combat maneuvers (collapsible): Push, Sprint, Trip, Grapple, Disarm, Dirty Trick, Disengage, Intercept Melee/Ranged, Take a Breather (solo and assisted).
- **Move target panel.** Move info card (type, class, DB, AC, range, attack stat, effect text). Target list showing all combatants with HP, out-of-range targets disabled. Cancel and "Use [MoveName]" buttons.
- **Combat stages modal.** Per-combatant stat stage adjustments.
- **Status conditions modal.** Apply/remove status conditions.
- **Damage mode toggle.** "Set" (pre-calculated) vs "Rolled" (dice-rolled) damage modes.

## Capture Flow

- **Capture section on wild Pokemon cards.** Only appears when a trainer is present. Per-wild-Pokemon: trainer selector, ball type selector, context condition checkboxes, capture rate display, throw button.
- **Capture API.** Preview endpoint (calculates rate considering level, HP%, evolution stage, status, injuries, shiny, legendary, ball modifier) and attempt endpoint (accuracy roll with nat 1/20 rules, capture roll, on-success: links Pokemon to trainer with origin 'captured', loyalty 2/Wary, ball-specific post-capture effects).
- **Ball effects.** Heal Ball restores HP, Friend Ball +1 loyalty, Luxury Ball notes happiness. New species = +1 trainer XP.
- **WebSocket broadcast.** Capture attempt results broadcast to all clients.

## Battle Grid (VTT)

- **Dual rendering modes.** Flat 2D square grid and isometric 2.5D. Toggle between them.
- **Token sprites.** Pokemon sprites and trainer avatars on the grid. Selection highlighting, multi-select (Shift+Click, Shift+Drag marquee).
- **Grid controls.** Zoom in/out/reset, pan (arrow keys, middle-click drag, scroll wheel), coordinate display, dimensions display, gridlines toggle.
- **Measurement tools.** Distance mode, burst AoE, cone AoE, line AoE, cycle direction, resize AoE. All keyboard-shortcut accessible.
- **Fog of war.** Reveal tool, hide tool, explore tool, brush size adjustment. Three-state model.
- **Terrain painting.** Four tool modes, accessible via T shortcut.
- **Token selection panel.** Opens on token select, shows combatant details.
- **Movement range toggle.** W shortcut to show movement range overlay.
- **Player grid view.** Read-only version of the grid on the player's phone with zoom controls.
- **Group grid view.** Read-only spectating version on the TV.
- **Touch support.** Pan and pinch gestures on the player grid view (phone).

## Scenes

- **Scene manager.** Grid of scene cards with name, entity count, activate/deactivate toggle, edit link, delete button. Active scene gets green border + "Active" badge.
- **Scene editor.** Three-column layout: Groups panel (left), Canvas (center), Properties/Add/Habitat panels (right, collapsible).
- **Scene canvas.** Drag-and-drop positioning of entities. Percentage-based positions. Sprites with name labels. Groups as dashed-border rectangles with resize handles. Drag entity onto group to assign.
- **Scene groups.** Create, name (inline-editable), delete. Deleting a group unassigns members (doesn't remove from scene). Move groups to move all members together.
- **Scene properties.** Location name, background image URL, description, narrative weather (distinct from encounter game weather).
- **Scene add panel.** Two tabs: Characters (list all characters, add to scene) and Pokemon (character-owned Pokemon expandable list + "Add Wild Pokemon" with species search and level spinner).
- **Scene activation.** Activating a scene resets move counters and restores AP. Deactivation restores AP. Active scene shows on group view scene tab. Real-time sync to connected clients.
- **Scene-to-encounter.** Start encounter from scene. Battle type and significance selection. Wild Pokemon become DB-backed enemies. Characters become player combatants.

## Habitats (Encounter Tables)

- **Habitat list page.** Grid of habitat cards with search and sort.
- **Habitat detail page.** Header with name, Settings/Generate/Delete buttons. Metadata: description, level range, population density, total weight.
- **Pokemon entries table.** Columns: sprite + species name, weight (editable spinbutton), chance (calculated percentage, color-coded green=common/red=rare), level range (editable min/max overrides), remove button. Sorted by weight descending. Inline editing with optimistic updates.
- **Weight → chance.** Entry weight / total weight = encounter probability. Adjusting any weight immediately recalculates all percentages.
- **Add Pokemon modal.** Species search, add to table. Duplicate species prevented.
- **Sub-habitats.** Named variants (e.g. "Night") with modification entries that override parent weights. Create, edit (name/description), delete. Each modification shows affected Pokemon and modified weight.
- **Encounter generation.** Weighted random selection with diversity decay (weight halved per selection, per-species cap of ceil(count/2)). Level randomized within entry-specific or table-default range. "Generate" button on habitat page opens modal showing results.
- **Wild spawn overlay.** When generation triggers, the group view shows a dramatic full-screen "WILD POKEMON APPEARED!" overlay with staggered sprite animations, species names, and levels.

## Player View

- **Character selection.** Identity picker on first load — choose which character to play as.
- **Bottom tab navigation.** Character, Team, Encounter, Scene. Active tab highlighted. Encounter tab shows notification dot when encounter is active.
- **Character tab.** Read-only collapsible sections: Stats (default open), Combat Info (default open), Skills, Features/Edges, Equipment, Inventory (default closed). HP bar with color coding and percentage.
- **Team tab.** Expandable Pokemon cards: sprite, name, level, types. Expand to see stats, abilities, capabilities, moves. All read-only.
- **Pokemon moves display.** Collapsed: type badge, move name, damage category, DB, AC, frequency. Expanded: adds range line and effect description text.
- **Encounter tab.** Header (name, round, current turn). VTT map with zoom. Player/enemy participant lists. Action panel for submitting combat actions.
- **Scene tab.** Passive display of active scene.
- **Player action requests.** Player submits actions via WebSocket promise. GM receives, approves/rejects. Player gets acknowledgment. Specialized handlers for capture, breather, healing item; generic handler for everything else.
- **Group view control.** Request tab changes on TV (with 30-second cooldown, 30-second GM response timeout, pending state feedback).
- **Connection status indicator.** Shows WebSocket connection state.
- **Export/Import.** Export character data. Import limited to safe fields (background, personality, goals, notes, Pokemon nicknames/held items/move order).
- **Auto-connect.** WebSocket connects automatically on page load.

## Group View (TV)

- **Four tabs.** Lobby, Scene, Encounter, Map. GM-controlled, no local interaction.
- **Lobby tab.** Player character cards in responsive grid. Each card: trainer sprite/avatar, name, player name, level badge, Pokemon team list (sprite, nickname, level, type pips, HP bar). Fainted Pokemon at 50% opacity + grayscale.
- **Encounter tab.** Three-column: initiative sidebar (280px/400px@4K), central grid (read-only), combatant details panel (320px/450px@4K). Header with encounter name, round badge, weather badge with remaining rounds, current turn indicator.
- **Initiative tracker.** All combatants sorted by initiative. Color-coded by side. Current turn highlighted with glow. "Cannot Act" label on incapacitated combatants. "Flanked" badge. HP bars with four-tier coloring. Phase-aware title ("Declaration Low→High", "Resolution High→Low", "Pokemon Phase").
- **Declaration summary.** In League battles: trainer declarations with action type badges (color-coded), description, resolution checkmarks. Currently resolving gets violet highlight. Resolved at 60% opacity.
- **Combatant details panel.** Sprite/avatar, name, side badge. Type badges. HP bar (exact for players, percentage for enemies). Injuries as red pips. Player-side: stat grid, abilities, moves as type-colored cards, non-zero combat stages. Status conditions for all.
- **Wild spawn overlay.** Full-screen dramatic reveal: "WILD POKEMON APPEARED!" with staggered sprite pop-in animations, encounter table name, species name/level/sprite per slot. Dark backdrop with blur.
- **4K optimization.** At viewport >3000px: base font to 1.5rem, all sprites/elements/padding scale up (avatars 64→96px, sprites 120→240px, sidebar 280→400px, etc.).
- **TV-optimized layout.** Dark radial gradient background with subtle violet/scarlet accents. Full-height, no scrolling.

## Environment and Weather

- **Weather selector.** Dropdown: No Weather, Sunny, Rain, Sandstorm, Hail, Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds. Mechanical effects in combat.
- **Environment presets.** Dropdown: None, Dim Cave (Blindness), Dark Cave (Total Blindness), Frozen Lake, Hazard Factory, Custom. Preset effects displayed as typed cards.
- **Scene weather vs encounter weather.** Scene weather is narrative only ("it's raining in the story"). Encounter weather has mechanical combat effects. Explicitly different systems.

## XP and Progression

- **Encounter XP section.** Significance multiplier display. Breakdown appears after enemies defeated.
- **XP distribution modal.** Distributes XP to participants after encounter.
- **Trainer XP.** GM grants XP from character detail page. XP bank system. Suggestion tiers.
- **Level-up modal.** Triggered by XP grant or manual level edit. Multi-step wizard: class selection, stat allocation, skill ranks, edges. Advancement schedule governs what's available per level.

---

**Note:** The previous app's *implementation* (god-object stores, bypassed service layer, component duplication, PTU data models, 144 unsafe type casts) is being discarded. This catalog records *what the app did for users* — the functionality, workflows, and UX patterns that the redesign must preserve or improve upon. It is not a specification — some behaviors will change under PTR rules (e.g. classes → traits, abilities → traits, PTU capture formula → PTR capture formula). But the user-facing workflows (create character, run encounter, capture Pokemon, manage habitats, generate wild encounters) must have equivalents in the new app.

**Status:** Functionality catalog complete. Habitats confirmed as important — encounter generation, weighted species pools, sub-habitat modifications, and the wild spawn overlay are key session-running features. ~~Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~ Handoff for adversarial review posted below.

