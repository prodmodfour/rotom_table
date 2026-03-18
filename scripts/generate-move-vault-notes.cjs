#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHILOSOPHY_DIR = path.join(ROOT, 'vaults/philosophy');
const DOCUMENTATION_DIR = path.join(ROOT, 'vaults/documentation');

// ─── CSV Parsing ───────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parseMoves() {
  const csv = fs.readFileSync(path.join(ROOT, 'app/data/moves.csv'), 'utf-8');
  const lines = csv.split('\n');
  const moves = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fields = parseCSVLine(trimmed);
    const name = (fields[0] || '').trim();
    if (!name || name === 'Name') continue;

    const type = (fields[10] || '').trim();
    const damageClass = (fields[9] || '').trim();
    if (!type || !damageClass) continue;

    moves.push({
      name,
      damageBase: (fields[3] || '').trim(),
      frequency: (fields[4] || '').trim(),
      ac: (fields[5] || '').trim(),
      range: (fields[6] || '').trim(),
      effect: (fields[7] || '').trim(),
      contestStats: (fields[8] || '').trim(),
      damageClass,
      type,
      flags: {
        sheerForce: (fields[11] || '').trim() === 'o',
        toughClaws: (fields[12] || '').trim() === 'o',
        technician: (fields[13] || '').trim() === 'o',
        reckless: (fields[14] || '').trim() === 'o',
        ironFist: (fields[15] || '').trim() === 'o',
        megaLauncher: (fields[16] || '').trim() === 'o',
        punkRock: (fields[18] || '').trim() === 'o',
        strongJaw: (fields[19] || '').trim() === 'o',
      },
    });
  }
  return moves;
}

// ─── Helpers ───────────────────────────────────────────────────

function toKebabCase(name) {
  return name
    .toLowerCase()
    .replace(/\[sm\]/g, 'sm')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function aOrAn(word) {
  if (!word) return 'a';
  return 'AEIOUaeiou'.includes(word[0]) ? 'an' : 'a';
}

function getActiveFlags(flags) {
  const names = [];
  if (flags.sheerForce) names.push('Sheer Force');
  if (flags.toughClaws) names.push('Tough Claws');
  if (flags.technician) names.push('Technician');
  if (flags.reckless) names.push('Reckless');
  if (flags.ironFist) names.push('Iron Fist');
  if (flags.megaLauncher) names.push('Mega Launcher');
  if (flags.punkRock) names.push('Punk Rock');
  if (flags.strongJaw) names.push('Strong Jaw');
  return names;
}

function hasDB(move) {
  return move.damageBase && move.damageBase !== '--' && move.damageBase !== 'See Effect';
}

function hasAC(move) {
  return move.ac && move.ac !== '--';
}

function isDamaging(move) {
  return move.damageClass === 'Physical' || move.damageClass === 'Special';
}

function hasEffect(move) {
  return move.effect && move.effect !== '--';
}

// Extract "*Grants XYZ" from effect text, returns { cleaned, capabilities }
function extractCapabilities(effect) {
  if (!effect) return { cleaned: effect, capabilities: [] };
  const match = effect.match(/\s*\*Grants?\s+(.+?)$/i);
  if (!match) return { cleaned: effect, capabilities: [] };
  const cleaned = effect.replace(/\s*\*Grants?\s+.+$/i, '').trim();
  const caps = match[1].split(/[,&]/).map(c => c.trim()).filter(Boolean);
  return { cleaned, capabilities: caps };
}

// ─── Effect Detection ──────────────────────────────────────────

function detectStatusConditions(effect) {
  if (!effect || effect === '--') return [];
  const found = [];
  if (/paralyz/i.test(effect)) found.push('paralysis');
  if (/\bburns?\b/i.test(effect) && !/sunburn/i.test(effect)) found.push('burn');
  if (/freez|frozen/i.test(effect) && !/freeze-dry/i.test(effect)) found.push('freeze');
  if (/badly poison/i.test(effect)) found.push('badly_poisoned');
  else if (/\bpoison/i.test(effect) && !/poison.type/i.test(effect)) found.push('poison');
  if (/confuse/i.test(effect)) found.push('confusion');
  if (/flinch/i.test(effect)) found.push('flinch');
  if (/\basleep\b|falls?\s+asleep/i.test(effect)) found.push('sleep');
  if (/\bstuck\b/i.test(effect)) found.push('stuck');
  if (/\btrapped\b/i.test(effect)) found.push('trapped');
  if (/\bvortex\b/i.test(effect)) found.push('vortex');
  if (/\bslowed\b/i.test(effect)) found.push('slowed');
  if (/\binfatuat/i.test(effect)) found.push('infatuated');
  if (/\bcursed?\b/i.test(effect)) found.push('cursed');
  if (/\benraged?\b/i.test(effect)) found.push('enraged');
  if (/\bsuppressed\b/i.test(effect)) found.push('suppressed');
  if (/\bdisabled?\b/i.test(effect)) found.push('disabled');
  return found;
}

function detectMechanics(effect) {
  if (!effect || effect === '--') return [];
  const found = [];
  if (/[+-]\d+\s*cs\b/i.test(effect) || /combat stage/i.test(effect)) found.push('cs_change');
  if (/critical hit on \d+/i.test(effect)) found.push('crit_range');
  if (/regains?\s+hp|recover|gains?\s+hp|heals?\b/i.test(effect)) found.push('healing');
  if (/recoil/i.test(effect)) found.push('recoil');
  if (/cannot miss|can't miss/i.test(effect)) found.push('cannot_miss');
  return found;
}

function detectRangeKeywords(range) {
  if (!range) return [];
  const found = [];
  if (/priority/i.test(range)) found.push('priority');
  if (/interrupt/i.test(range)) found.push('interrupt');
  if (/\bpush\b/i.test(range)) found.push('push');
  if (/\bmelee\b/i.test(range)) found.push('melee');
  if (/\bburst\b/i.test(range)) found.push('burst');
  if (/\bcone\b/i.test(range)) found.push('cone');
  if (/close\s*blast/i.test(range)) found.push('blast');
  if (/five strike/i.test(range)) found.push('five_strike');
  if (/doublestrike/i.test(range)) found.push('doublestrike');
  if (/\bshield\b/i.test(range)) found.push('shield');
  if (/\bdash\b/i.test(range)) found.push('dash');
  if (/\bhazard\b/i.test(range)) found.push('hazard');
  if (/groundsource/i.test(range)) found.push('groundsource');
  if (/\bsonic\b/i.test(range)) found.push('sonic');
  if (/\baura\b/i.test(range)) found.push('aura');
  if (/spirit surge/i.test(range)) found.push('spirit_surge');
  if (/\bpowder\b/i.test(range)) found.push('powder');
  if (/\bsmite\b/i.test(range)) found.push('smite');
  if (/\bself\b/i.test(range)) found.push('self');
  return found;
}

// ─── Philosophy Note ──────────────────────────────────────────

function generatePhilosophy(move) {
  const damaging = isDamaging(move);
  const conditions = detectStatusConditions(move.effect);
  const mechanics = detectMechanics(move.effect);
  const rangeKw = detectRangeKeywords(move.range);
  const { cleaned: effectText, capabilities } = extractCapabilities(move.effect);

  // Frequency link
  let freqLink;
  const f = move.frequency;
  if (f === 'At-Will') freqLink = 'At-Will';
  else if (f === 'EOT') freqLink = '[[scene-frequency-eot-restriction|EOT]]';
  else if (f.startsWith('Scene')) freqLink = `[[scene-frequency-definition|${f}]]`;
  else if (f.startsWith('Daily')) freqLink = `[[scene-frequency-definition|${f}]]`;
  else if (f === 'Static') freqLink = 'Static';
  else freqLink = f;

  const dcLink = `[[type-effectiveness-excludes-status-moves|${move.damageClass}]]`;
  const dbText = hasDB(move) ? `a Damage Base of ${move.damageBase}` : (move.damageBase === 'See Effect' ? 'a variable Damage Base (see effect)' : 'no Damage Base');
  const acText = hasAC(move) ? `AC ${move.ac}` : 'no AC';

  let content = `${move.name} is ${aOrAn(move.type)} ${move.type}-type ${dcLink} move with ${dbText}, ${freqLink} frequency, ${acText}, and a range of ${move.range}.`;

  // Effect paragraph
  if (hasEffect(move) && effectText) {
    content += `\n\n${effectText}`;

    // Threshold annotation
    const thresholdMatch = move.effect.match(/on (\d+)\+/);
    if (thresholdMatch && conditions.length > 0) {
      content += ` The ${thresholdMatch[1]}+ threshold is a natural die result; [[modifiers-dont-shift-effect-triggers|accuracy modifiers do not shift it]].`;
    }
  }

  // Capability grants
  if (capabilities.length > 0) {
    content += `\n\n${move.name} grants the ${capabilities.join(' and ')} [[move-granted-capabilities|${capabilities.length > 1 ? 'capabilities' : 'capability'}]] while known.`;
  }

  // Daily frequency context
  if (f.startsWith('Daily')) {
    const n = f === 'Daily' ? 1 : parseInt(f.match(/\d+/)?.[0] || '1');
    if (n > 1) {
      content += `\n\nAs a ${f} move, ${move.name} can be used in ${n} different scenes during the day but [[daily-moves-once-per-scene|never twice in the same scene]]. Its daily uses refresh on [[extended-rest-refreshes-daily-moves|extended rest]].`;
    } else {
      content += `\n\nAs a Daily move, ${move.name} can be used once per day, refreshing on [[extended-rest-refreshes-daily-moves|extended rest]]. It is still limited to [[daily-moves-once-per-scene|one use per scene]].`;
    }
  }

  // See also
  const seeAlso = [];

  if (damaging) {
    seeAlso.push(`[[stab-adds-to-damage-base]] — ${move.type}-type users add +2 DB`);
  }

  if (move.type === 'Fire' && damaging) {
    seeAlso.push('[[sunny-weather-effects]] — Fire moves gain +5 damage in Sun');
    seeAlso.push('[[rain-weather-effects]] — Fire moves lose -5 damage in Rain');
  }
  if (move.type === 'Water' && damaging) {
    seeAlso.push('[[rain-weather-effects]] — Water moves gain +5 damage in Rain');
    seeAlso.push('[[sunny-weather-effects]] — Water moves lose -5 damage in Sun');
  }

  if (conditions.includes('paralysis')) {
    seeAlso.push('[[type-grants-status-immunity]] — Electric-types are immune to Paralysis');
    seeAlso.push('[[status-cs-auto-apply-with-tracking]] — Paralysis applies -4 Speed CS');
  }
  if (conditions.includes('burn')) {
    seeAlso.push('[[type-grants-status-immunity]] — Fire-types are immune to Burns');
    seeAlso.push('[[tick-value-one-tenth-max-hp]]');
    seeAlso.push('[[status-cs-auto-apply-with-tracking]] — Burn applies -2 Defense CS');
  }
  if (conditions.includes('freeze')) {
    seeAlso.push('[[type-grants-status-immunity]] — Ice-types are immune to Freeze');
    seeAlso.push('[[frozen-cured-by-damage-types]]');
  }
  if (conditions.includes('poison') || conditions.includes('badly_poisoned')) {
    seeAlso.push('[[type-grants-status-immunity]] — Poison-type and Steel-type are immune to Poison');
    seeAlso.push('[[tick-value-one-tenth-max-hp]]');
  }
  if (conditions.includes('confusion')) seeAlso.push('[[confused-three-outcome-save]]');
  if (conditions.includes('sleep')) seeAlso.push('[[sleep-volatile-but-persists]]');
  if (conditions.includes('stuck')) seeAlso.push('[[stuck-blocks-movement-not-actions]]');
  if (conditions.includes('trapped') || conditions.includes('vortex')) seeAlso.push('[[trapped-is-only-recall-blocker]]');
  if (conditions.includes('slowed')) seeAlso.push('[[slowed-halves-movement]]');
  if (mechanics.includes('cs_change')) seeAlso.push('[[combat-stage-asymmetric-scaling]]');
  if (mechanics.includes('crit_range') && !conditions.length) seeAlso.push('[[modifiers-dont-shift-effect-triggers]]');
  if (mechanics.includes('recoil')) seeAlso.push('[[hp-loss-recoil-vs-self-cost]]');

  if (rangeKw.includes('priority') || rangeKw.includes('interrupt')) seeAlso.push('[[priority-and-interrupt-actions]]');
  if (rangeKw.includes('push')) seeAlso.push('[[push-chains-with-movement]]');
  if (rangeKw.includes('melee') && damaging) seeAlso.push('[[melee-range-is-adjacency]]');
  if (rangeKw.includes('five_strike') || rangeKw.includes('doublestrike')) seeAlso.push('[[damage-formula-step-order]] — Five/Double-Strike modifies damage at step 2');

  if (f.startsWith('Scene') || f === 'EOT') seeAlso.push('[[scene-boundary-resets-frequencies]]');

  const unique = [...new Set(seeAlso)];
  if (unique.length > 0) {
    content += '\n\n## See also\n\n';
    content += unique.map(l => `- ${l}`).join('\n');
  }

  content += '\n';
  return content;
}

// ─── Documentation Note ───────────────────────────────────────

function generateDocumentation(move) {
  const damaging = isDamaging(move);
  const conditions = detectStatusConditions(move.effect);
  const mechanics = detectMechanics(move.effect);
  const rangeKw = detectRangeKeywords(move.range);
  const activeFlags = getActiveFlags(move.flags);
  const { capabilities } = extractCapabilities(move.effect);

  const dbVal = hasDB(move) ? move.damageBase : (move.damageBase === 'See Effect' ? '"See Effect"' : 'null');
  const acVal = hasAC(move) ? move.ac : 'null';

  let content = `${move.name} is stored in [[movedata-reference-table]] with \`damageClass: "${move.damageClass}"\`, \`type: "${move.type}"\`, \`damageBase: ${dbVal}\`, \`frequency: "${move.frequency}"\`, \`ac: ${acVal}\`, \`range: "${move.range}"\`.`;

  // ── Frequency ──
  content += '\n\n## Frequency\n\n';
  const f = move.frequency;
  if (f === 'At-Will') {
    content += 'At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.';
  } else if (f === 'EOT') {
    content += 'EOT frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` compares `lastTurnUsed` against the current turn index to prevent consecutive-turn use.';
  } else if (f.startsWith('Scene')) {
    const n = f === 'Scene' ? 1 : parseInt(f.match(/\d+/)?.[0] || '1');
    content += `${f} frequency is enforced by the [[move-frequency-system]]. \`checkMoveFrequency\` checks the \`usedThisScene\` counter against a limit of ${n}`;
    if (n > 1) content += ', with [[scene-frequency-eot-restriction|EOT pacing]] between uses';
    content += '. The counter resets via [[scene-activation-resets-move-counters]].';
  } else if (f.startsWith('Daily')) {
    const n = f === 'Daily' ? 1 : parseInt(f.match(/\d+/)?.[0] || '1');
    content += `${f} frequency is enforced by the [[move-frequency-system]]. \`checkMoveFrequency\` checks both the \`usedToday\` counter (limit of ${n}) and the per-scene cap — daily moves can only be used [[daily-moves-once-per-scene|once per scene]] regardless of remaining daily uses. Daily uses refresh on [[extended-rest|extended rest]].`;
  } else if (f === 'Static') {
    content += 'Static frequency means this move cannot be used actively in combat. It provides a passive effect only. The [[move-frequency-system]] blocks all use attempts.';
  }

  // ── Resolution ──
  content += '\n\n## Resolution\n\n';
  if (damaging) {
    const db = hasDB(move) ? `DB ${move.damageBase}` : 'a variable Damage Base';
    content += `${move.name} flows through the standard [[damage-flow-pipeline]] with ${db} as the base. The [[nine-step-damage-formula]] applies STAB for ${move.type}-type users and type effectiveness.`;
    if (rangeKw.includes('five_strike')) content += ' The Five Strike keyword modifies damage at step 2 of the formula.';
    if (rangeKw.includes('doublestrike')) content += ' The Doublestrike keyword modifies damage at step 2 of the formula.';
    if (hasAC(move)) content += ` An accuracy roll against AC ${move.ac} is required via the [[evasion-and-accuracy-system]].`;
  } else {
    content += `As a Status move, ${move.name} skips the [[damage-flow-pipeline]].`;
    if (hasAC(move)) {
      content += ` An accuracy roll against AC ${move.ac} is required via the [[evasion-and-accuracy-system]].`;
    } else {
      content += ' No accuracy roll is needed (AC is null).';
    }
  }

  // ── Effect section ──
  if (hasEffect(move) && (conditions.length > 0 || mechanics.length > 0 || capabilities.length > 0)) {
    // Choose section title
    const isSecondary = damaging && conditions.length > 0;
    content += `\n\n## ${isSecondary ? 'Secondary Effect' : 'Effect'}\n\n`;

    const parts = [];

    if (conditions.includes('paralysis')) parts.push('The [[type-status-immunity-utility]] prevents Paralysis application on Electric-types. Once applied, [[status-cs-auto-apply-with-tracking]] handles the -4 Speed CS.');
    if (conditions.includes('burn')) parts.push('The [[type-status-immunity-utility]] prevents Burn application on Fire-types. Once applied, [[status-tick-automation]] handles tick damage and [[status-cs-auto-apply-with-tracking]] applies the -2 Defense CS.');
    if (conditions.includes('freeze')) parts.push('The [[type-status-immunity-utility]] prevents Freeze application on Ice-types.');
    if (conditions.includes('badly_poisoned')) parts.push('The [[type-status-immunity-utility]] prevents application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles the escalating tick damage at turn boundaries, and the [[condition-source-rules]] track what inflicted the condition.');
    if (conditions.includes('poison') && !conditions.includes('badly_poisoned')) parts.push('The [[type-status-immunity-utility]] prevents Poison application on Poison-type and Steel-type targets. Once applied, [[status-tick-automation]] handles tick damage.');
    if (conditions.includes('flinch')) parts.push('Flinch prevents the target from taking actions for the remainder of the turn, tracked as a volatile condition.');
    if (conditions.includes('confusion')) parts.push('Confusion follows the [[confused-three-outcome-save]] resolution.');
    if (conditions.includes('sleep')) parts.push('Sleep is tracked as a volatile condition that [[sleep-volatile-but-persists|persists through recall and encounter end]].');
    if (conditions.includes('stuck')) parts.push('The Stuck condition is tracked via the [[condition-source-rules]].');
    if (conditions.includes('trapped') || conditions.includes('vortex')) parts.push('The Trapped condition blocks recall, tracked via the [[condition-source-rules]].');
    if (conditions.includes('slowed')) parts.push('The Slowed condition halves movement, tracked via the [[condition-source-rules]].');
    if (conditions.includes('infatuated')) parts.push('Infatuation is tracked as a volatile condition via the [[condition-source-rules]].');
    if (conditions.includes('cursed')) parts.push('The Cursed condition triggers tick damage, handled by [[status-tick-automation]].');
    if (conditions.includes('enraged')) parts.push('The Enraged condition is tracked via the [[condition-source-rules]].');
    if (conditions.includes('suppressed')) parts.push('The Suppressed condition downgrades move frequencies, interacting with the [[move-frequency-system]].');
    if (conditions.includes('disabled')) parts.push('The Disabled condition is tracked via the [[condition-source-rules]].');

    if (mechanics.includes('cs_change')) parts.push('Combat stage changes are applied through the [[combat-stage-system]].');
    if (mechanics.includes('healing')) parts.push('The HP recovery is described in the `effect` text field.');

    if (capabilities.length > 0) parts.push(`The ${capabilities.join(' and ')} capability grant is tracked through the [[combatant-capabilities-utility]].`);

    content += parts.join(' ');
  }

  // ── Range and Targeting ──
  if (rangeKw.includes('burst') || rangeKw.includes('cone') || rangeKw.includes('blast') || rangeKw.includes('groundsource')) {
    content += '\n\n## Range and Targeting\n\n';
    const rangeParts = [];
    if (rangeKw.includes('burst') || rangeKw.includes('cone') || rangeKw.includes('blast')) {
      rangeParts.push(`The area of effect is visualized by the [[measurement-aoe-modes]] system.`);
    }
    if (rangeKw.includes('groundsource')) {
      rangeParts.push('The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.');
    }
    content += rangeParts.join(' ');
  }

  // ── Interrupt ──
  if (rangeKw.includes('interrupt') || rangeKw.includes('priority')) {
    content += '\n\n## Timing\n\n';
    if (rangeKw.includes('interrupt')) {
      content += `${move.name} uses the [[hold-priority-interrupt-system|Interrupt system]], resolving outside normal turn order in response to a trigger.`;
    } else {
      content += `${move.name} has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.`;
    }
  }

  // ── Ability Interactions ──
  content += '\n\n## Ability Interactions\n\n';
  if (activeFlags.length > 0) {
    content += `Flagged for ${activeFlags.join(', ')} in the [[moves-csv-source-file]].`;
  } else {
    content += 'No ability-interaction flags are set in the [[moves-csv-source-file]].';
  }

  // ── See also ──
  const seeAlso = [];

  if (move.type === 'Fire' && damaging) seeAlso.push('[[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain');
  if (move.type === 'Water' && damaging) seeAlso.push('[[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny');
  if (f.startsWith('Daily')) {
    seeAlso.push('[[scene-activation-resets-move-counters]] — resets `usedThisScene` but preserves `usedToday`');
    seeAlso.push('[[new-day-reset]] — resets all daily move usage counters');
  }
  if (conditions.includes('badly_poisoned') || conditions.includes('burn') || conditions.includes('poison')) {
    seeAlso.push('[[faint-and-revival-effects]] — Faint clears Persistent conditions');
  }
  if (conditions.length > 0) {
    seeAlso.push('[[status-capture-bonus-hierarchy]] — status conditions modify capture rate');
  }

  const unique = [...new Set(seeAlso)];
  if (unique.length > 0) {
    content += '\n\n## See also\n\n';
    content += unique.map(l => `- ${l}`).join('\n');
  }

  content += '\n';
  return content;
}

// ─── Main ──────────────────────────────────────────────────────

const moves = parseMoves();
console.log(`Parsed ${moves.length} moves from CSV`);

let created = 0;
for (const move of moves) {
  const filename = toKebabCase(move.name) + '.md';

  fs.writeFileSync(path.join(PHILOSOPHY_DIR, filename), generatePhilosophy(move));
  fs.writeFileSync(path.join(DOCUMENTATION_DIR, filename), generateDocumentation(move));
  created++;
}

console.log(`Created ${created} moves × 2 vaults = ${created * 2} files`);
