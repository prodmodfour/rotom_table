---
id: decree-need-051
title: "Should edges store structured metadata beyond string names?"
priority: P3
severity: LOW
status: open
domain: character-lifecycle
source: character-lifecycle-audit.md (session 121, R066 ambiguous)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

Categoric Inclination and similar edges have metadata (e.g., chosen category) that affects mechanics. Currently edges are stored as plain strings. Should edges support structured metadata fields (category, rank, specialization)?

## Options

1. **Plain strings only**: Current behavior; metadata tracked externally by GM
2. **Structured edge objects**: Each edge stores `{ name, metadata: {...} }` with type-specific fields
3. **Tag-based**: Edge string includes parseable tags like "Categoric Inclination [Dark]"

## Impact

Affects whether edge-dependent mechanics can be automated.
