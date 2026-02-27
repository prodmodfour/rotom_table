---
cap_id: player-view-C085
name: player-view-C085
type: —
domain: player-view
---

### player-view-C085
- **name:** QR code generator (generateQrSvg)
- **type:** utility
- **location:** `app/utils/qrcode.ts`
- **game_concept:** QR code for player view URL sharing
- **description:** Pure TypeScript QR code generator that outputs SVG strings. Implements ISO/IEC 18004 QR Code specification (versions 1-6, EC level L). Used to share the player view URL with players (e.g., for LAN access). Includes encodeQR (returns module matrix) and generateQrSvg (returns SVG string with configurable module size, quiet zone, colors).
- **inputs:** text: string, options: QrSvgOptions (moduleSize, quietZone, foreground, background)
- **outputs:** SVG string
- **accessible_from:** player, gm

---

## Server-Side Utilities
