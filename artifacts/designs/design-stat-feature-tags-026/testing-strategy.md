# Testing Strategy

## Unit Tests: Parser Utility (`featureStatParser.test.ts`)

### Test File: `app/tests/unit/utils/featureStatParser.test.ts`

The parser is the critical component -- if it's wrong, all downstream calculations are wrong. Comprehensive test coverage is mandatory.

### T1: Explicit [+Stat] Tag Parsing

```typescript
describe('parseFeatureStatBonuses', () => {
  describe('explicit tag parsing', () => {
    it('parses [+HP] tag', () => {
      const result = parseFeatureStatBonuses(['Athlete [+HP]'])
      expect(result.bonuses).toHaveLength(1)
      expect(result.bonuses[0]).toEqual({
        stat: 'hp', value: 1, source: 'Athlete [+HP]'
      })
      expect(result.totals.hp).toBe(1)
    })

    it('parses [+Speed] tag', () => {
      const result = parseFeatureStatBonuses(['Capture Specialist [+Speed]'])
      expect(result.totals.speed).toBe(1)
    })

    it('parses [+Attack] tag', () => {
      const result = parseFeatureStatBonuses(['Rogue [+Attack]'])
      expect(result.totals.attack).toBe(1)
    })

    it('parses [+Defense] tag', () => {
      const result = parseFeatureStatBonuses(['Roughneck [+Defense]'])
      expect(result.totals.defense).toBe(1)
    })

    it('parses [+Special Attack] tag', () => {
      const result = parseFeatureStatBonuses(['Musician [+Special Attack]'])
      expect(result.totals.specialAttack).toBe(1)
    })

    it('parses [+Special Defense] tag', () => {
      const result = parseFeatureStatBonuses(['Oracle [+Special Defense]'])
      expect(result.totals.specialDefense).toBe(1)
    })
  })
})
```

### T2: Multiple Features with Same Stat

```typescript
describe('stat stacking', () => {
  it('stacks multiple [+HP] bonuses', () => {
    const result = parseFeatureStatBonuses([
      'Athlete [+HP]',
      'Training Regime [+HP]'
    ])
    expect(result.totals.hp).toBe(2)
    expect(result.bonuses).toHaveLength(2)
  })

  it('stacks bonuses across different stats', () => {
    const result = parseFeatureStatBonuses([
      'Athlete [+HP]',
      'Capture Specialist [+Speed]',
      'Rogue [+Attack]'
    ])
    expect(result.totals.hp).toBe(1)
    expect(result.totals.speed).toBe(1)
    expect(result.totals.attack).toBe(1)
  })

  it('handles the PTU example: Lisa with 2 [+HP] features', () => {
    // PTU Core p. 15 example
    const result = parseFeatureStatBonuses([
      'Ace Trainer',      // no [+Stat]
      'Perseverance',     // no [+Stat]
      'Athlete',          // [+HP] via fallback
      'Training Regime'   // [+HP] via fallback
    ])
    expect(result.totals.hp).toBe(2)
  })
})
```

### T3: FEATURE_STAT_MAP Fallback

```typescript
describe('FEATURE_STAT_MAP fallback', () => {
  it('resolves known feature by name without explicit tag', () => {
    const result = parseFeatureStatBonuses(['Athlete'])
    expect(result.totals.hp).toBe(1)
  })

  it('resolves case-insensitively', () => {
    const result = parseFeatureStatBonuses(['athlete'])
    expect(result.totals.hp).toBe(1)
  })

  it('strips ranked suffix for lookup', () => {
    const result = parseFeatureStatBonuses(['Terrain Talent (Rank 2)'])
    expect(result.totals.hp).toBe(1)
  })

  it('returns no bonus for unknown feature', () => {
    const result = parseFeatureStatBonuses(['Perseverance'])
    expect(result.bonuses).toHaveLength(0)
    expect(result.totals).toEqual({})
  })

  it('returns no bonus for features without [+Stat] tags', () => {
    const result = parseFeatureStatBonuses([
      'Ace Trainer',
      'Quick Switch',
      'Command Versatility'
    ])
    expect(result.bonuses).toHaveLength(0)
  })
})
```

### T4: [+Any Stat] Handling

```typescript
describe('[+Any Stat] features', () => {
  it('flags [+Any Stat] features without applying bonus', () => {
    const result = parseFeatureStatBonuses(["Fighter's Versatility [+Any Stat]"])
    expect(result.anyStatFeatures).toContain("Fighter's Versatility [+Any Stat]")
    expect(result.bonuses).toHaveLength(0)
  })

  it('resolves [+Any Stat] when user has chosen', () => {
    // User chose Speed for Fighter's Versatility
    const result = parseFeatureStatBonuses(["Fighter's Versatility [+Speed]"])
    expect(result.totals.speed).toBe(1)
    expect(result.anyStatFeatures).toHaveLength(0)
  })

  it('handles mixed [+Any Stat] and resolved choices', () => {
    const result = parseFeatureStatBonuses([
      "Fighter's Versatility [+Speed]",    // resolved
      "Signature Move [+Any Stat]",         // not yet resolved
      "Type Expertise [+Attack]"            // resolved
    ])
    expect(result.totals.speed).toBe(1)
    expect(result.totals.attack).toBe(1)
    expect(result.anyStatFeatures).toEqual(["Signature Move [+Any Stat]"])
  })
})
```

### T5: Non-Stat Tags Ignored

```typescript
describe('non-stat tags', () => {
  it('ignores [Class] tag', () => {
    const result = parseFeatureStatBonuses(['Capture Specialist [Class] [+Speed]'])
    expect(result.totals.speed).toBe(1)
    expect(result.bonuses).toHaveLength(1)
  })

  it('ignores [Orders] tag', () => {
    const result = parseFeatureStatBonuses(['Wilderness Guide [+HP] [Orders]'])
    expect(result.totals.hp).toBe(1)
    expect(result.bonuses).toHaveLength(1)
  })

  it('ignores [Ranked N] tag', () => {
    const result = parseFeatureStatBonuses(['Hex Maniac Studies [+HP] [Ranked 3]'])
    expect(result.totals.hp).toBe(1)
  })

  it('ignores [Weapon] tag', () => {
    const result = parseFeatureStatBonuses(['Cutthroat [+Attack] [Weapon]'])
    expect(result.totals.attack).toBe(1)
    expect(result.bonuses).toHaveLength(1)
  })

  it('ignores [Branch] tag', () => {
    const result = parseFeatureStatBonuses(['Some Feature [Branch]'])
    expect(result.bonuses).toHaveLength(0)
  })
})
```

### T6: Explicit Tag Takes Priority Over Fallback

```typescript
describe('priority chain', () => {
  it('uses explicit tag even if feature is in FEATURE_STAT_MAP', () => {
    // "Athlete" is in the map as [+HP], but if user typed with explicit tag, use tag
    const result = parseFeatureStatBonuses(['Athlete [+HP]'])
    expect(result.totals.hp).toBe(1)
    expect(result.bonuses).toHaveLength(1) // Should not double-count
  })

  it('does not double-count explicit tag + fallback', () => {
    const result = parseFeatureStatBonuses(['Athlete [+HP]'])
    expect(result.totals.hp).toBe(1) // Not 2
  })
})
```

### T7: Edge Cases

```typescript
describe('edge cases', () => {
  it('handles empty feature list', () => {
    const result = parseFeatureStatBonuses([])
    expect(result.bonuses).toHaveLength(0)
    expect(result.totals).toEqual({})
    expect(result.anyStatFeatures).toHaveLength(0)
  })

  it('handles feature with only whitespace', () => {
    const result = parseFeatureStatBonuses(['  '])
    expect(result.bonuses).toHaveLength(0)
  })

  it('handles feature with multiple [+Stat] tags (should not happen in PTU but be robust)', () => {
    const result = parseFeatureStatBonuses(['Weird Feature [+HP] [+Speed]'])
    expect(result.totals.hp).toBe(1)
    expect(result.totals.speed).toBe(1)
    expect(result.bonuses).toHaveLength(2)
  })

  it('handles abbreviations in explicit tags', () => {
    const result = parseFeatureStatBonuses(['Feature [+Atk]'])
    expect(result.totals.attack).toBe(1)
  })

  it('handles Martial Artist branch abilities', () => {
    // The ability name itself is in the fallback map
    const result = parseFeatureStatBonuses(['Guts'])
    expect(result.totals.hp).toBe(1)
  })

  it('handles feature names with special characters', () => {
    const result = parseFeatureStatBonuses(["Gotta Catch 'Em All"])
    expect(result.totals.speed).toBe(1)
  })
})
```

### T8: `computeFeatureBonusStats` Helper

```typescript
describe('computeFeatureBonusStats', () => {
  it('adds feature bonuses to base stats', () => {
    const baseStats: Stats = {
      hp: 13, attack: 7, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 10
    }
    const features = ['Athlete', 'Training Regime'] // Both [+HP]

    const result = computeFeatureBonusStats(baseStats, features)

    expect(result.hp).toBe(15) // 13 + 2
    expect(result.attack).toBe(7) // unchanged
    expect(result.speed).toBe(10) // unchanged
  })

  it('handles no bonuses', () => {
    const baseStats: Stats = {
      hp: 10, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    }
    const result = computeFeatureBonusStats(baseStats, ['Ace Trainer', 'Perseverance'])
    expect(result).toEqual(baseStats)
  })
})
```

---

## Integration Testing Notes

### Manual Test Scenarios (GM View)

1. **Create character with [+HP] features:**
   - Create a new character with features "Athlete" and "Training Regime"
   - Verify HP stat shows BASE_HP + allocated + 2
   - Verify maxHp calculation uses the bonus-inclusive HP

2. **Edit character features:**
   - Open existing character, add "Dancer" feature
   - Verify Speed stat increases by 1
   - Save and reload -- stat should persist

3. **Level-up with new features:**
   - Level up a character, select "Blur" as new feature
   - Verify Speed stat in the summary shows +1 from feature
   - Confirm and verify final stats are correct

4. **Remove feature:**
   - Remove a feature that has [+Stat]
   - Verify stat decreases accordingly
   - Save and reload -- stat should reflect removal

5. **[+Any Stat] feature:**
   - Add "Fighter's Versatility" -- should prompt for stat choice
   - Choose a stat -- verify bonus applies to that stat
   - Save -- feature string should include the chosen tag

### Validation Against PTU Example

From PTU Core p. 15:
- Lisa's trainer: 13 HP base (10 base + 3 allocated) + 2 [+HP] (Athlete + Training Regime) = **15 HP**
- maxHp = level(1) * 2 + hp(15) * 3 + 10 = 2 + 45 + 10 = **57 HP**

Test this exact scenario in both unit tests and manual testing.

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| FEATURE_STAT_MAP gets stale if new features are added | Map is comprehensive from PTU 1.05. No new features expected. GM can always add explicit [+Stat] tags. |
| Double-counting when both explicit tag AND fallback match | Parser uses priority chain -- explicit tag found means fallback is skipped |
| Level-up stat delta calculation error | Test the delta computation: old features vs new features, verify only the diff is applied |
| GM overrides stats manually, then adds feature | Feature bonus applied on top of override. This is the correct behavior (soft automation). |
| Performance with many features | Negligible. Regex parsing of ~30 strings is sub-millisecond. No concern. |
