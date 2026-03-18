# Shotgun Surgery

A [[change-preventer-smells|change preventer]] [[code-smells|smell]]. A single change requires many small modifications scattered across many different classes. Related logic is fragmented across the codebase, making updates error-prone and tedious to track.

The inverse of [[divergent-change-smell]]: divergent change is many kinds of changes concentrated in one class, while shotgun surgery is one kind of change scattered across many classes.

## See also

- [[heavily-injured-penalty-duplication]] — changing the mechanic requires editing 12 files
- [[status-condition-ripple-effect]] — adding a condition touches 20+ files
- [[transaction-script-turn-lifecycle]] — changing one game system requires editing the 847-line transaction script among others
