The fog of war system implements PTU's darkness penalties as written, with preset configurations for common scenarios (daylight, dim, dark, pitch black).

Presets stay within RAW per [[presets-stay-within-raw]]; GMs can set custom visibility values via manual input when a scenario falls outside standard conditions. Per [[information-asymmetry-by-role]], darkness filtering differs by viewer role — what the GM sees is not what the player sees.

The underlying implementation lives in the [[fog-of-war-system]], which applies visibility masks based on the active darkness preset or custom value.

## See also
- [[information-asymmetry-by-role]]
- [[presets-stay-within-raw]]
- [[fog-of-war-system]]
