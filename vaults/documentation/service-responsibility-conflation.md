# Service Responsibility Conflation

The 24 server services mix three distinct concerns: business logic (game rules), data access (Prisma queries), and orchestration (coordinating multiple operations). A single service function often validates input, queries the database, applies game rules, writes results, and broadcasts via WebSocket — five responsibilities in one function.

## Example: `combatant.service.ts`

This 791-line file handles:

- **Damage calculation** (game rule) — STAB, type effectiveness, critical hits, weather modifiers
- **Healing application** (game rule) — HP restoration, overheal prevention, injury clearing
- **Status condition management** (game rule + data access) — application, removal, duration tracking
- **Stage modifier management** (game rule + data access) — combat stage changes, cap enforcement
- **Combatant building** (data access + transformation) — parsing Pokemon entities, building combatant objects from database rows
- **Initiative calculation** (game rule) — speed-based ordering with modifiers

Each of these is a distinct domain operation. They share a file because they all involve "combatants" — but that's [[horizontal-layer-coupling|horizontal grouping by entity]], not vertical grouping by responsibility.

## The conflation pattern

```typescript
// Typical service function — three concerns interleaved
async function dealDamage(encounterId: string, targetId: string, amount: number) {
  // 1. Data access (Prisma query)
  const encounter = await prisma.encounter.findUnique(...)
  const combatants = JSON.parse(encounter.combatants)

  // 2. Business logic (game rules)
  const target = combatants.find(c => c.id === targetId)
  const absorbed = Math.min(target.tempHp, amount)
  target.hp = Math.max(0, target.hp - (amount - absorbed))

  // 3. Orchestration (persistence + broadcast)
  await prisma.encounter.update({ data: { combatants: JSON.stringify(combatants) } })
  broadcast(encounterId, encounter)
}
```

This function is untestable without a database. Its game logic cannot be verified independently. Its data access pattern cannot be changed without modifying the game rules. These three concerns change for different reasons and should be separate.

## Relationship to existing notes

- **[[service-pattern-classification]]** identifies four service types: pure functions, DB writers, hybrids, and orchestrators. The problem is that most services are hybrids — they should be decomposed into pure functions (game logic) and DB writers (persistence).
- **[[game-logic-boundary-absence]]** identifies the absence of a game logic boundary. This note zooms in on why: because services conflate game logic with data access, there is no layer that is purely rules.
- **[[routes-bypass-service-layer]]** identifies that routes sometimes bypass services. Part of the reason is that services don't provide clean, focused operations — calling a service for a simple operation pulls in Prisma, parsing, and serialization overhead.

## See also

- [[service-pattern-classification]] — the taxonomy that identifies the hybrid problem
- [[game-logic-boundary-absence]] — the broader boundary problem
- [[service-layer-pattern]] — the pattern being violated
- [[single-responsibility-principle]] — the principle being violated
- [[service-inventory]] — the full list of services exhibiting this pattern
- [[repository-use-case-architecture]] — the destructive proposal to decompose services into repositories and use cases
