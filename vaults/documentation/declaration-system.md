# Declaration System

Trainer declaration phase in [[battle-modes|League Battle]] encounters.

## API

`POST /api/encounters/:id/declare` — record trainer declaration.

## Components

`DeclarationPanel.vue` — GM declaration form: action type select, description input, submit + next turn.

`DeclarationSummary.vue` — declaration list display for Group View: collapsible round declarations with resolving/resolved state indicators.

## WebSocket

- `trainer_declared` — GM broadcasts after declaration.
- `declaration_update` — updated declarations array to encounter room for Group View sync.

Part of the [[battle-modes|League Battle]] flow within [[turn-lifecycle]].
