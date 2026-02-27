/**
 * Migrates monolithic matrix files into atomized per-entry files.
 *
 * For each domain:
 *   1. Split {domain}-rules.md → matrix/{domain}/rules/{domain}-RNNN.md + _index.md
 *   2. Split {domain}-capabilities.md → matrix/{domain}/capabilities/{domain}-CNNN.md + _index.md
 *   3. Split {domain}-audit.md → matrix/{domain}/audit/tier-N-*.md + _index.md
 *   4. Move {domain}-matrix.md → matrix/{domain}/matrix.md (stays monolithic)
 *   5. Archive originals → matrix/_archive/{domain}-YYYYMMDD/
 *   6. Generate domain _index.md
 *
 * Usage: node scripts/migrate-matrix.mjs [domain...]
 *   No args = migrate all domains
 *   With args = migrate only specified domains (e.g., "combat capture")
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..')
const MATRIX_DIR = join(ROOT, 'artifacts/matrix')

const ALL_DOMAINS = [
  'combat', 'vtt-grid', 'pokemon-lifecycle', 'character-lifecycle',
  'healing', 'scenes', 'encounter-tables', 'capture', 'player-view',
]

// ---------------------------------------------------------------------------
// YAML Frontmatter Parser (same as regenerate-artifact-indexes.mjs)
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { frontmatter: {}, body: content }

  const yaml = match[1]
  const data = {}
  let currentKey = null
  let currentArray = null

  for (const line of yaml.split('\n')) {
    const arrayMatch = line.match(/^  - (.+)/)
    if (arrayMatch && currentKey) {
      if (!currentArray) {
        currentArray = []
        data[currentKey] = currentArray
      }
      currentArray.push(arrayMatch[1].trim())
      continue
    }

    const nestedMatch = line.match(/^  (\w+):\s*(.+)/)
    if (nestedMatch && currentKey && !currentArray) {
      if (data[currentKey] == null || typeof data[currentKey] !== 'object' || Array.isArray(data[currentKey])) {
        data[currentKey] = {}
      }
      data[currentKey][nestedMatch[1]] = parseValue(nestedMatch[2])
      continue
    }

    const kvMatch = line.match(/^(\S[\w_-]*):\s*(.*)/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      currentArray = null
      const rawVal = kvMatch[2].trim()
      if (rawVal === '' || rawVal === '[]') {
        data[currentKey] = rawVal === '[]' ? [] : null
      } else {
        data[currentKey] = parseValue(rawVal)
      }
    }
  }

  const body = content.slice(match[0].length).replace(/^\n+/, '')
  return { frontmatter: data, body }
}

function parseValue(raw) {
  if (raw === 'null' || raw === '~') return null
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  if (/^\d+\.\d+$/.test(raw)) return parseFloat(raw)
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw.slice(1, -1).split(',').map((s) => parseValue(s.trim())).filter((s) => s !== '')
  }
  return raw
}

// ---------------------------------------------------------------------------
// Rules Splitter
// ---------------------------------------------------------------------------

function splitRules(domain) {
  const filePath = join(MATRIX_DIR, `${domain}-rules.md`)
  if (!existsSync(filePath)) {
    console.log(`  ⚠ No rules file for ${domain}`)
    return { count: 0, summaryParts: {} }
  }

  const content = readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  const outDir = join(MATRIX_DIR, domain, 'rules')
  mkdirSync(outDir, { recursive: true })

  // Extract summary sections (before first rule entry)
  const firstRuleIdx = body.search(/\n## [a-z]+-R\d{3}:/i)
  const summaryText = firstRuleIdx > 0 ? body.slice(0, firstRuleIdx).trim() : ''

  // Split on ## {domain}-RNNN: headers
  const rulePattern = new RegExp(`^## (${domain}-R\\d{3}): (.+)$`, 'gm')
  const rules = []
  let lastIdx = null
  let lastId = null
  let lastName = null

  for (const match of body.matchAll(rulePattern)) {
    if (lastIdx !== null) {
      rules.push({
        id: lastId,
        name: lastName,
        content: body.slice(lastIdx, match.index).trim(),
      })
    }
    lastIdx = match.index
    lastId = match[1]
    lastName = match[2]
  }
  // Last rule
  if (lastIdx !== null) {
    rules.push({
      id: lastId,
      name: lastName,
      content: body.slice(lastIdx).trim(),
    })
  }

  // Write individual rule files
  for (const rule of rules) {
    // Extract inline metadata
    const category = rule.content.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] || '—'
    const scope = rule.content.match(/\*\*Scope:\*\*\s*(\S+)/)?.[1] || '—'
    const ptuRef = rule.content.match(/\*\*PTU Ref:\*\*\s*`([^`]+)`/)?.[1] || '—'
    const deps = rule.content.match(/\*\*Dependencies:\*\*\s*(.+)/)?.[1] || 'none'

    const ruleFile = `---\nrule_id: ${rule.id}\nname: ${rule.name}\ncategory: ${category}\nscope: ${scope}\ndomain: ${domain}\n---\n\n${rule.content}\n`
    writeFileSync(join(outDir, `${rule.id}.md`), ruleFile, 'utf-8')
  }

  // Write rules _index.md
  let indexContent = `---\ndomain: ${domain}\ntype: rules\ntotal_rules: ${rules.length}\nextracted_at: ${frontmatter.extracted_at || '—'}\nextracted_by: ${frontmatter.extracted_by || '—'}\n---\n\n# Rules: ${domain}\n\n`

  if (summaryText) {
    indexContent += `${summaryText}\n\n`
  }

  indexContent += `## Rule Listing\n\n`
  indexContent += `| Rule ID | Name | Category | Scope |\n`
  indexContent += `|---------|------|----------|-------|\n`
  for (const rule of rules) {
    const category = rule.content.match(/\*\*Category:\*\*\s*(\S+)/)?.[1] || '—'
    const scope = rule.content.match(/\*\*Scope:\*\*\s*(\S+)/)?.[1] || '—'
    indexContent += `| ${rule.id} | ${rule.name} | ${category} | ${scope} |\n`
  }

  writeFileSync(join(outDir, '_index.md'), indexContent, 'utf-8')

  return { count: rules.length, frontmatter }
}

// ---------------------------------------------------------------------------
// Capabilities Splitter
// ---------------------------------------------------------------------------

function splitCapabilities(domain) {
  const filePath = join(MATRIX_DIR, `${domain}-capabilities.md`)
  if (!existsSync(filePath)) {
    console.log(`  ⚠ No capabilities file for ${domain}`)
    return { count: 0 }
  }

  const content = readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  const outDir = join(MATRIX_DIR, domain, 'capabilities')
  mkdirSync(outDir, { recursive: true })

  // Extract summary text (before first capability)
  const firstCapIdx = body.search(new RegExp(`\n#{2,3} ${domain}-C\\d{3}`, 'i'))
  const summaryText = firstCapIdx > 0 ? body.slice(0, firstCapIdx).trim() : ''

  // Split on ## or ### {domain}-CNNN[: name] headers (some use h2, some h3, some omit colon)
  const capPattern = new RegExp(`^#{2,3} (${domain}-C\\d{3})(?::\\s*(.+)|\\s*)$`, 'gm')
  const caps = []
  let lastIdx = null
  let lastId = null
  let lastName = null

  for (const match of body.matchAll(capPattern)) {
    if (lastIdx !== null) {
      const content = body.slice(lastIdx, match.index).trim()
      caps.push({
        id: lastId,
        name: lastName || content.match(/\*\*name\*\*:\s*(.+)/)?.[1] || lastId,
        content,
      })
    }
    lastIdx = match.index
    lastId = match[1]
    lastName = match[2] || null
  }
  if (lastIdx !== null) {
    const content = body.slice(lastIdx).trim()
    caps.push({
      id: lastId,
      name: lastName || content.match(/\*\*name\*\*:\s*(.+)/)?.[1] || lastId,
      content,
    })
  }

  // Write individual capability files
  for (const cap of caps) {
    const type = cap.content.match(/\*\*type\*\*:\s*(\S+)/)?.[1] || '—'

    const capFile = `---\ncap_id: ${cap.id}\nname: ${cap.name}\ntype: ${type}\ndomain: ${domain}\n---\n\n${cap.content}\n`
    writeFileSync(join(outDir, `${cap.id}.md`), capFile, 'utf-8')
  }

  // Write capabilities _index.md
  let indexContent = `---\ndomain: ${domain}\ntype: capabilities\ntotal_capabilities: ${caps.length}\nmapped_at: ${frontmatter.mapped_at || '—'}\nmapped_by: ${frontmatter.mapped_by || '—'}\n---\n\n# Capabilities: ${domain}\n\n`

  if (summaryText) {
    indexContent += `${summaryText}\n\n`
  }

  indexContent += `## Capability Listing\n\n`
  indexContent += `| Cap ID | Name | Type |\n`
  indexContent += `|--------|------|------|\n`
  for (const cap of caps) {
    const type = cap.content.match(/\*\*type\*\*:\s*(\S+)/)?.[1] || '—'
    indexContent += `| ${cap.id} | ${cap.name} | ${type} |\n`
  }

  writeFileSync(join(outDir, '_index.md'), indexContent, 'utf-8')

  return { count: caps.length, frontmatter }
}

// ---------------------------------------------------------------------------
// Audit Splitter
// ---------------------------------------------------------------------------

function splitAudit(domain) {
  const filePath = join(MATRIX_DIR, `${domain}-audit.md`)
  if (!existsSync(filePath)) {
    console.log(`  ⚠ No audit file for ${domain}`)
    return { count: 0 }
  }

  const content = readFileSync(filePath, 'utf-8')
  const { frontmatter, body } = parseFrontmatter(content)

  const outDir = join(MATRIX_DIR, domain, 'audit')
  mkdirSync(outDir, { recursive: true })

  // Extract summary (before first Tier heading)
  const firstTierIdx = body.search(/\n## Tier \d+:/i)
  const summaryText = firstTierIdx > 0 ? body.slice(0, firstTierIdx).trim() : body.trim()

  // Split by Tier headings
  const tierPattern = /^## (Tier \d+: .+)$/gm
  const tiers = []
  let prevTierEnd = null
  let prevTierTitle = null
  let prevTierStart = null

  for (const match of body.matchAll(tierPattern)) {
    if (prevTierStart !== null) {
      tiers.push({
        title: prevTierTitle,
        content: body.slice(prevTierStart, match.index).trim(),
      })
    }
    prevTierStart = match.index
    prevTierTitle = match[1]
  }
  if (prevTierStart !== null) {
    tiers.push({
      title: prevTierTitle,
      content: body.slice(prevTierStart).trim(),
    })
  }

  // Count entries per tier and separate correct items
  const correctItems = []
  const actionItems = []

  for (const tier of tiers) {
    // Multiple audit entry formats:
    //   ### N. capture-R001 — Name        (capture, combat)
    //   ### healing-R001: Name            (healing)
    //   ### R001 — Name                   (vtt-grid — no domain prefix)
    //   ### Severity Breakdown...         (summary header, skip)
    const entryPattern = /^### (?:\d+\.\s*)?(?:(\S+-R\d{3})|R(\d{3}))\s*[—–:\-]\s*(.+)$/gm
    for (const m of tier.content.matchAll(entryPattern)) {
      const id = m[1] || `${domain}-R${m[2]}`
      const name = m[3].trim()
      // Find the classification for THIS entry (search from match position to next ### or end)
      const entryEnd = tier.content.indexOf('\n### ', m.index + 1)
      const entryText = entryEnd > 0
        ? tier.content.slice(m.index, entryEnd)
        : tier.content.slice(m.index)
      const classification = entryText.match(/\*\*(?:Revised )?Classification:\*\*\s*(\S+)/)?.[1] || '—'
      if (classification === 'Correct') {
        correctItems.push({ id, name, tier: tier.title })
      } else {
        actionItems.push({ id, name, tier: tier.title, classification })
      }
    }
  }

  // Write tier files
  for (const tier of tiers) {
    const tierNum = tier.title.match(/Tier (\d+)/)?.[1] || '0'
    const tierSlug = tier.title
      .replace(/^Tier \d+:\s*/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '')
    const filename = `tier-${tierNum}-${tierSlug}.md`
    writeFileSync(join(outDir, filename), `${tier.content}\n`, 'utf-8')
  }

  // Write correct-items.md (COLD storage)
  if (correctItems.length > 0) {
    let correctContent = `# Verified Correct Items: ${domain}\n\n`
    correctContent += `| Rule ID | Name | Tier |\n`
    correctContent += `|---------|------|------|\n`
    for (const item of correctItems) {
      correctContent += `| ${item.id} | ${item.name} | ${item.tier} |\n`
    }
    writeFileSync(join(outDir, 'correct-items.md'), correctContent, 'utf-8')
  }

  // Write audit _index.md
  const total = frontmatter.total_audited || frontmatter.items_audited || correctItems.length + actionItems.length
  let indexContent = `---\ndomain: ${domain}\ntype: audit\ntotal_audited: ${total}\ncorrect: ${frontmatter.correct ?? correctItems.length}\nincorrect: ${frontmatter.incorrect ?? 0}\napproximation: ${frontmatter.approximation ?? 0}\nambiguous: ${frontmatter.ambiguous ?? 0}\naudited_at: ${frontmatter.audited_at || '—'}\naudited_by: ${frontmatter.audited_by || '—'}\n---\n\n# Audit: ${domain}\n\n`

  if (summaryText) {
    indexContent += `${summaryText}\n\n`
  }

  if (actionItems.length > 0) {
    indexContent += `## Action Items\n\n`
    indexContent += `| Rule ID | Name | Classification | Tier |\n`
    indexContent += `|---------|------|---------------|------|\n`
    for (const item of actionItems) {
      indexContent += `| ${item.id} | ${item.name} | ${item.classification} | ${item.tier} |\n`
    }
  }

  indexContent += `\n## Tier Files\n\n`
  for (const tier of tiers) {
    const tierNum = tier.title.match(/Tier (\d+)/)?.[1] || '0'
    const tierSlug = tier.title.replace(/^Tier \d+:\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    indexContent += `- [${tier.title}](tier-${tierNum}-${tierSlug}.md)\n`
  }
  if (correctItems.length > 0) {
    indexContent += `- [Verified Correct Items](correct-items.md) (${correctItems.length} items)\n`
  }

  writeFileSync(join(outDir, '_index.md'), indexContent, 'utf-8')

  return {
    count: correctItems.length + actionItems.length,
    tiers: tiers.length,
    correct: correctItems.length,
    action: actionItems.length,
    frontmatter,
  }
}

// ---------------------------------------------------------------------------
// Domain Index Generator
// ---------------------------------------------------------------------------

function generateDomainIndex(domain, rulesResult, capsResult, auditResult) {
  const domainDir = join(MATRIX_DIR, domain)
  const matrixFile = join(domainDir, 'matrix.md')
  const hasMatrix = existsSync(matrixFile)

  let out = `---\ndomain: ${domain}\ngenerated_at: ${new Date().toISOString()}\n---\n\n# Matrix Domain: ${domain}\n\n`

  out += `## Pipeline Status\n\n`
  out += `| Stage | Status | Count | Last Updated |\n`
  out += `|-------|--------|-------|--------------|\n`
  out += `| Rules | ${rulesResult.count > 0 ? 'complete' : 'missing'} | ${rulesResult.count} | ${(rulesResult.frontmatter?.extracted_at || '—').toString().slice(0, 10)} |\n`
  out += `| Capabilities | ${capsResult.count > 0 ? 'complete' : 'missing'} | ${capsResult.count} | ${(capsResult.frontmatter?.mapped_at || '—').toString().slice(0, 10)} |\n`
  out += `| Matrix | ${hasMatrix ? 'complete' : 'missing'} | — | — |\n`
  out += `| Audit | ${auditResult.count > 0 ? 'complete' : 'missing'} | ${auditResult.count} audited | ${(auditResult.frontmatter?.audited_at || '—').toString().slice(0, 10)} |\n`

  if (auditResult.count > 0) {
    out += `\n## Audit Summary\n\n`
    out += `- Correct: ${auditResult.correct}\n`
    out += `- Action items: ${auditResult.action}\n`
    out += `- Tiers: ${auditResult.tiers}\n`
  }

  out += `\n## Subdirectories\n\n`
  out += `- [Rules](rules/_index.md)\n`
  out += `- [Capabilities](capabilities/_index.md)\n`
  out += `- [Matrix](matrix.md)\n`
  out += `- [Audit](audit/_index.md)\n`

  writeFileSync(join(domainDir, '_index.md'), out, 'utf-8')
}

// ---------------------------------------------------------------------------
// Archive + Move
// ---------------------------------------------------------------------------

function archiveAndMove(domain) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const archiveDir = join(MATRIX_DIR, '_archive', `${domain}-${today}`)
  mkdirSync(archiveDir, { recursive: true })

  const domainDir = join(MATRIX_DIR, domain)

  // Archive originals
  const files = ['rules', 'capabilities', 'matrix', 'audit']
  for (const type of files) {
    const src = join(MATRIX_DIR, `${domain}-${type}.md`)
    if (existsSync(src)) {
      copyFileSync(src, join(archiveDir, `${domain}-${type}.md`))
    }
  }

  // Move matrix.md into domain dir (stays monolithic)
  const matrixSrc = join(MATRIX_DIR, `${domain}-matrix.md`)
  if (existsSync(matrixSrc)) {
    const matrixContent = readFileSync(matrixSrc, 'utf-8')
    writeFileSync(join(domainDir, 'matrix.md'), matrixContent, 'utf-8')
    unlinkSync(matrixSrc)
  }

  // Remove originals (now in archive + atomized)
  for (const type of ['rules', 'capabilities', 'audit']) {
    const src = join(MATRIX_DIR, `${domain}-${type}.md`)
    if (existsSync(src)) {
      unlinkSync(src)
    }
  }

  return archiveDir
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const domains = args.length > 0
    ? args.filter((d) => ALL_DOMAINS.includes(d))
    : ALL_DOMAINS

  if (domains.length === 0) {
    console.error('No valid domains specified. Available:', ALL_DOMAINS.join(', '))
    process.exit(1)
  }

  console.log(`Migrating matrix files for ${domains.length} domain(s): ${domains.join(', ')}\n`)

  const results = []

  for (const domain of domains) {
    console.log(`\n── ${domain} ──`)

    // Check if already migrated
    const domainDir = join(MATRIX_DIR, domain)
    if (existsSync(join(domainDir, 'rules', '_index.md'))) {
      console.log(`  ⚠ Already migrated (${domainDir}/rules/_index.md exists). Skipping.`)
      results.push({ domain, skipped: true })
      continue
    }

    // Split
    const rulesResult = splitRules(domain)
    console.log(`  Rules: ${rulesResult.count} entries`)

    const capsResult = splitCapabilities(domain)
    console.log(`  Capabilities: ${capsResult.count} entries`)

    const auditResult = splitAudit(domain)
    console.log(`  Audit: ${auditResult.count} entries (${auditResult.tiers || 0} tiers, ${auditResult.correct || 0} correct, ${auditResult.action || 0} action)`)

    // Archive and move (must happen before domain index so matrix.md is in place)
    const archiveDir = archiveAndMove(domain)

    // Generate domain index
    generateDomainIndex(domain, rulesResult, capsResult, auditResult)
    console.log(`  Archived originals → ${archiveDir.replace(ROOT + '/', '')}`)

    results.push({
      domain,
      rules: rulesResult.count,
      capabilities: capsResult.count,
      audit: auditResult.count,
    })
  }

  // Validation summary
  console.log('\n── Summary ──\n')
  console.log('| Domain | Rules | Caps | Audit | Status |')
  console.log('|--------|-------|------|-------|--------|')
  for (const r of results) {
    if (r.skipped) {
      console.log(`| ${r.domain} | — | — | — | skipped (already migrated) |`)
    } else {
      console.log(`| ${r.domain} | ${r.rules} | ${r.capabilities} | ${r.audit} | migrated |`)
    }
  }
}

main()
