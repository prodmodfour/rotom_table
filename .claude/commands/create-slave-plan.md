---
name: create_slave_plan
description: Create a parallelized slave plan. Analyzes pipeline state, determines optimal parallel task assignments, writes slave-plan.json and launch script. Run this first, then launch slaves.
---

load .claude/skills/master-planner.md
