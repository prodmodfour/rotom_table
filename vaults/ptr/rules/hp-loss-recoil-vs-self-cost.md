HP loss effects are split into two sub-types based on [[intent-based-classification]]:

- **Recoil** (Life Orb, environmental): absorbs temp HP per PTU p.247's "any other effects" language. The Pokemon didn't choose to take damage, so [[temp-hp-as-meaningful-shield]] applies.
- **Self-cost** (Belly Drum): bypasses temp HP. The cost IS the point — a deliberate sacrifice where temp HP shouldn't negate the trade-off.
- **setHp** (Pain Split, Endeavor): always bypasses temp HP.

The `HpReductionType` union must capture this distinction.

## See also

- [[massive-damage-after-temp-hp]] — recoil absorbing temp HP prevents massive damage checks; self-cost bypassing temp HP does not
- [[item-proficiency-traits]] — traits like Life Orb Immunity can negate recoil costs entirely
