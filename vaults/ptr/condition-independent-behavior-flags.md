Each status condition has independent behavior flags: `clearsOnRecall`, `clearsOnFaint`, `clearsOnEncounterEnd`. Category membership (volatile, persistent, other, [[fatigued-is-its-own-condition-category|fatigued]]) is for display and grouping only, never for deriving behaviors.

This model allows any condition to have whatever combination of behaviors is correct without being forced into a rigid package. [[sleep-volatile-but-persists]] — volatile but `clearsOnRecall: false`. [[other-conditions-source-dependent-faint]] — Other conditions with `clearsOnFaint: false` by default but source-dependent clearing at runtime.

This is the implementation of [[decouple-behaviors-from-categories]].
