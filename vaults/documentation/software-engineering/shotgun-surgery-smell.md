# Shotgun Surgery

A [[change-preventer-smells|change preventer]] [[code-smells|smell]]. A single change requires many small modifications scattered across many different classes. Related logic is fragmented across the codebase, making updates error-prone and tedious to track.

The inverse of [[divergent-change-smell]]: divergent change is many kinds of changes concentrated in one class, while shotgun surgery is one kind of change scattered across many classes.

## See also

- [[divergent-change-smell]] — the inverse: many kinds of changes in one class vs. one kind of change across many classes
