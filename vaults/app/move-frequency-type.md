The `MoveFrequency` type (`app/types/combat.ts`, line 91) is a union of string literals: `'At-Will'`, `'EOT'`, `'Scene'`, `'Scene x2'`, `'Scene x3'`, `'Daily'`, `'Daily x2'`, `'Daily x3'`, and `'Static'`.

This type is used by the [[move-interface-tracks-usage-counters]] `frequency` field and drives all frequency validation in the [[move-frequency-utility]].

The union does not include `'See Text'`, which is the stored frequency for [[curse-frequency-stored-as-see-text]].
