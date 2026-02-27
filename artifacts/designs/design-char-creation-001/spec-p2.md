# P2 Specification

## F. Biographical Fields Section (P2)

### New File: `app/components/create/BiographySection.vue`

#### User Flow

Collapsible section with:
- Age (number input)
- Gender (text input, not select -- PTU allows any)
- Height (number input, cm, with lbs display toggle)
- Weight (number input, kg, with lbs display toggle + auto weight class display)
- Background Story (textarea, maps to `background` DB field)
- Personality (textarea)
- Goals (textarea)
- Money (number input, default 5000 for level 1 per PTU p. 17)

This section is optional -- all fields are nullable in the DB. The section is collapsed by default for NPC creation and expanded for Player Characters.

---


## G. Quick-Create vs Full-Create Mode Toggle (P2)

### User Flow

When the user selects "Human Character" on the create page:

1. **Two sub-modes** appear as tabs or radio buttons:
   - **Quick Create** (current flow, minimal): Name, Type, Level, raw Stats, Notes. For rapid NPC scaffolding.
   - **Full Create** (new flow, PTU-compliant): Multi-section form following PTU steps.

2. **Full Create sections** are displayed as an accordion or vertical stepper:
   - Section 1: Basic Info (name, type, level, location)
   - Section 2: Background & Skills
   - Section 3: Edges (4)
   - Section 4: Classes & Features (max 4 classes, 4+1 features)
   - Section 5: Combat Stats (10-point allocation)
   - Section 6: Biography (collapsible, optional)

3. Each section shows a completion indicator (checkmark when filled, count when partial)

4. The "Create" button is always enabled (no hard validation blocks -- the GM decides when the character is ready)

---

