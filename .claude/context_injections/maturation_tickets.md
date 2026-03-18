- A maturation ticket is something that needs the decision of a human
- When something that needs maturing is found in a vault (see .claude/context_injections/maturation.md), a maturation ticket is made.
    - For ptr vault maturation tickets: .claude/tickets/maturation_tickets/ptr/open
    - For Documentation vault maturation tickets: .claude/tickets/maturation_tickets/documentation/open

# Ticket Template

```markdown
# Basic Info
    - Topic:
    - Vault:
    - Priority: 

# Explanation
    - Point 1
    - Point 2
    - Point 3
    - ... (No limit)

# Relevant Notes

## Note Title
    - Note Body Text


# Possible Decisions
## Safe Decision

## Moderate Decision

## Radical Decision


# Final Decision
```

- Priority is based on how playable to the game is without the decision being made
- All relavant notes are reproduced in Relevant Notes, not just one.
- Final Decision is filled by the human. 

# Digesting closed tickets
    - Closed maturation tickets (found in .claude/tickets/maturation_tickets/documentation/closed and .claude/tickets/maturation_tickets/ptr/closed) are to be digested into the relavant vault. 
    - Once digested, they are deleted. (See .claude/context_injections/digesting_ptr.md and .claude/context_injections/digesting_documentation.md)
