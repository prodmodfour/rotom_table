The canonical data table containing every Pokemon move's mechanical properties: name, type, damageClass (Physical/Special/Status), damageBase, frequency, ac, range, and effect text. Each move observation note in this vault references its entry here.

The table is derived from the [[moves-csv-source-file]] and drives the [[damage-flow-pipeline]], [[evasion-and-accuracy-system]], and [[move-energy-system]]. The damageBase feeds into the [[nine-step-damage-formula]], while ac and evasion interact through the [[evasion-and-accuracy-system]].

## See also

- [[moves-csv-source-file]] — raw import source for this table
- [[damage-flow-pipeline]] — consumes damageBase, damageClass, and type
- [[evasion-and-accuracy-system]] — consumes ac values
- [[move-energy-system]] — consumes frequency values
- [[nine-step-damage-formula]] — uses damageBase as a core input
- [[move-observation-index]] — index of all 806 observed move notes that reference this table
