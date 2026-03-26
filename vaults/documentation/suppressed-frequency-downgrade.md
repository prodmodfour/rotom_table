Suppressed is a volatile condition that modifies move frequencies: At-Will becomes EOT, EOT becomes Scene, Scene becomes Daily. This is a unique mechanical effect — no other status condition alters the frequency system.

The app implements this as a frequency modifier within [[move-energy-system]], not as a special case in the condition system. When a Pokemon is Suppressed, the frequency resolver applies a one-step downgrade to each move's base frequency before checking usage limits. This keeps the condition system and the frequency system [[separate-mechanics-stay-separate|separate]] — Suppressed is just another frequency modifier source, like abilities or items that alter frequencies.

Suppressed is also notable as a volatile condition with [[condition-independent-behavior-flags|behavior flags]] that follow the standard volatile pattern (clears on recall, clears on faint). Its uniqueness is in its *effect*, not its *lifecycle*.

## See also
- [[decouple-behaviors-from-categories]] — Suppressed cited as a volatile condition with unique behavior
- [[move-energy-system]] — where the downgrade is implemented
- [[condition-independent-behavior-flags]] — Suppressed's lifecycle flags are standard volatile
- [[status-condition-categories]] — Suppressed listed among the nine volatile conditions
