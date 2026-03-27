Documentation vault notes describe what the system should do and why — not what specific code artifacts did. Implementation file paths, component names, store names, and API route paths are artifacts that change when code is restructured or deleted; design concepts are stable.

## The contamination pattern

A note like "the damage calculation pipeline" is valid design intent. A note that opens with "implemented in `utils/damageCalculation.ts`" ties the design concept to a specific file. When that file is deleted or moved, the note appears stale even though the design intent hasn't changed. The file path is [[dead-code-smell|dead reference]] — weight without value.

## The convention

- **Reference design concepts by name**, not by implementation location. Write "the damage calculation pipeline" or "the capture rate formula," not "the function in `utils/captureRate.ts`."
- **If an implementation reference is genuinely useful** — because the concept maps to a specific module that IS the design (e.g., `@rotom/engine`) — use it. The test: if renaming the artifact would require updating the note, the reference is fragile. If the artifact name IS the design concept, the reference is stable.
- **Separate design from implementation when both are needed.** If a note must describe both what the system should do and where it currently lives in code, use a dedicated `## Implementation` section. The design content stays clean; the implementation section is the only part that changes when code moves.

This convention applies the [[separation-of-concerns]] principle to vault notes: design intent and implementation detail are separate concerns that change at different rates. Mixing them in a single note forces a change in the note whenever either concern changes.

## See also

- [[separation-of-concerns]] — design intent and implementation detail change at different rates and should not be mixed
- [[dead-code-smell]] — references to deleted code are the documentation equivalent of dead code
- [[thin-note-threshold]] — after removing implementation detail, a note may fall below the viability threshold
