The server rejects capture attempts against Pokemon at 0 HP.

This is a hard rule enforced via [[server-enforcement-with-gm-override]] — the GM can override if a special scenario requires it, but the default is rejection with a UI warning. The player sees a clear message explaining why the capture was blocked.

This check runs before the [[capture-rate-formula]] is evaluated, alongside the [[capture-accuracy-gate]].

## See also
- [[server-enforcement-with-gm-override]]
- [[capture-rate-formula]]
- [[capture-accuracy-gate]]
- [[faint-and-revival-effects]]
