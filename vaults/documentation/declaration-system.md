# Declaration System

Trainer declaration phase in [[battle-modes|League Battle]] encounters.

## Flow

During the declaration phase, each trainer declares their intended action in low-to-high speed order. Declarations are broadcast to all clients via WebSocket so the group view can display a summary of declared vs. pending trainers.

The GM view provides a declaration form (action type, description) and controls for advancing to resolution. The group view displays a collapsible list of declarations per round with resolving/resolved state indicators.

Part of the [[battle-modes|League Battle]] flow within [[turn-lifecycle]].
