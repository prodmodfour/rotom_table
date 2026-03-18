# Connection Utilities

## QR code utility

`utils/qrcode.ts` — Pure TypeScript QR code encoder. Byte mode, error correction level L, versions 1-6 (up to 134-char URLs). Exports `encodeQR()`, `generateQrSvg()`, and `QrSvgOptions`.

Referenced by [[gm-view-routes|SessionUrlDisplay.vue]] as [[qr-code-utility]].

## Connection type

`utils/connectionType.ts` — Shared `getConnectionType()` function returning `'localhost' | 'lan' | 'tunnel'` based on hostname. Used by `useWebSocket.ts` and `ConnectionStatus.vue`.

## ConnectionStatus.vue

Connection indicator dot with expandable details: connection type, state, latency, reconnect progress, retry button. Used in the [[player-view-architecture|Player View]].

## See also

- [[player-reconnection-sync]] — reconnection recovery logic
- [[player-page-orchestration]] — the player page that includes ConnectionStatus
