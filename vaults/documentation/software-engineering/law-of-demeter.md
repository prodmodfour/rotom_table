# Law of Demeter

"Only talk to your immediate friends."

A method should only call methods on: its own object, its parameters, objects it creates, and its direct component objects. It should not reach through one object to access another — that chains the caller to the internal structure of intermediaries.

Analogy: when paying for a taxi, you hand money to the driver. You don't reach into the driver's pocket to pull out their wallet, open it, and extract their change yourself.

In code: `encounter.getCombatant(id).entity.moves[0].name` forces the caller to know the internal structure of Combatant, Entity, and Move. Instead, `encounter.getMoveName(id, 0)` hides that chain behind a single call.

Also known as the Principle of Least Knowledge. Formulated by Karl Lieberherr in 1987.

## See also

- [[message-chains-smell]] — long method chains are a direct symptom of Demeter violations
- [[inappropriate-intimacy-smell]] — reaching into another class's internals violates Demeter
- [[feature-envy-smell]] — a method using another object's data more than its own often violates Demeter to access it
- [[facade-pattern]] — hides a subsystem behind a simplified interface, enforcing Demeter at the boundary
- [[mediator-pattern]] — routes communication through a central object, preventing direct cross-object chains
- [[tell-dont-ask]] — complementary principle; Demeter says "don't reach in," Tell Don't Ask says "push behavior to the data owner instead"
