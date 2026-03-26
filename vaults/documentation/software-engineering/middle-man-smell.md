# Middle Man

A [[coupler-smells|coupler]] [[code-smells|smell]]. A class whose primary job is delegating work to another class. If a class performs only one action — forwarding calls elsewhere — it adds a layer of indirection without providing meaningful value.

The fix is usually to [[remove-middle-man]] and let callers interact directly with the class doing the actual work.
