Some trainer classes branch into specializations using a naming suffix (e.g., Ace Trainer [Dragon]). The suffix encodes the specialization but doesn't require structured metadata — the suffix itself is the data.

This is simpler than the [[structured-edge-objects]] approach because the variation is just a label, not rich metadata that affects calculations. The app can extract the specialization by parsing the bracket content from the class name string.

## See also

- [[structured-edge-objects]] — the richer alternative when metadata goes beyond a label
- [[trainer-class-catalog]] — lists which classes use branching suffixes
