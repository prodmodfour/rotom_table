# Data Class

A [[dispensable-smells|dispensable]] [[code-smells|smell]]. A class that contains only fields and crude methods for accessing them (getters and setters), serving as a passive data container for other classes to manipulate.

Data classes lack independent behavior. When other classes reach into a data class to get values and compute things, that behavior likely belongs in the data class itself.

## See also

- [[move-method]] — move envious methods into the data class to give it real behavior
- [[encapsulate-field]] — hide public fields behind accessors as a first step
- [[data-clumps-smell]] — extracting data clumps sometimes produces data classes that need further enrichment with behavior
- [[feature-envy-smell]] — methods that heavily use a data class's fields are candidates for moving into the data class
- [[tell-dont-ask]] — data classes are the structural embodiment of violating this principle
