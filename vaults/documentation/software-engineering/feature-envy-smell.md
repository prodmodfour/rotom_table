# Feature Envy

A [[coupler-smells|coupler]] [[code-smells|smell]]. A method that accesses the data of another object more than its own. The method is more interested in another class's state than in the class it lives in, which suggests it logically belongs elsewhere.

The fix is usually to move the method to the class whose data it actually uses.

## See also

- [[move-method]] — the primary technique for fixing feature envy
- [[move-field]] — often applied alongside Move Method
- [[data-class-smell]] — feature envy often targets data classes, and moving the envious method into the data class gives it real behavior
- [[tell-dont-ask]] — the principle that feature envy violates; push behavior to the data owner
- [[law-of-demeter]] — envious methods often reach through object chains to access distant data
