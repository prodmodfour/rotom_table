The [[energy-resource|Energy]] formula maps [[stamina-stat|Stamina]] to Energy. Energy scales slowly compared to how health scales from HP.

**Energy = max(3, floor(2 × √Stamina))**

The floor of 3 ensures every combatant has a usable pool even at minimum Stamina. The square root curve gives diminishing returns — doubling Stamina only increases Energy by about 41%.

| Stamina | Energy | | Stamina | Energy |
|---------|--------|-|---------|--------|
| 1       | 3      | | 50      | 14     |
| 5       | 4      | | 60      | 15     |
| 10      | 6      | | 70      | 16     |
| 15      | 7      | | 80      | 17     |
| 20      | 8      | | 90      | 18     |
| 25      | 10     | | 100     | 20     |
| 30      | 10     | | 120     | 21     |
| 40      | 12     | | 150     | 24     |
