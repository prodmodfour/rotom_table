The server rejects capture attempts against Pokemon that are already owned by a trainer.

Like [[fainted-pokemon-cannot-be-captured]], this uses the standard [[server-enforcement-with-gm-override]] pattern. The default is rejection with a UI warning; the GM can override for special scenarios (e.g. a story event where ownership is contested).

This check runs before the [[capture-rate-formula]] is evaluated, alongside the [[capture-accuracy-gate]].

## See also
- [[server-enforcement-with-gm-override]]
- [[capture-rate-formula]]
- [[capture-accuracy-gate]]
