/**
 * Migrates monolithic design docs into per-design directories with atomized files.
 *
 * Input:  artifacts/designs/design-*.md (monolithic files)
 * Output: artifacts/designs/design-NAME/ (directories containing split files)
 *
 * Each design directory contains:
 *   _index.md           — frontmatter + summary + priority map (~50-80 lines)
 *   spec-p0.md           — P0 tier specification (if applicable)
 *   spec-p1.md           — P1 tier specification (if applicable)
 *   spec-p2.md           — P2 tier specification (if applicable)
 *   spec.md              — all specs (for designs without priority tiers)
 *   shared-specs.md      — composables, utilities, cross-cutting specs
 *   testing-strategy.md  — testing approach
 *   implementation-log.md — commit log, resolution log
 *
 * Usage: node scripts/migrate-designs.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join, resolve, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..')
const DESIGNS_DIR = join(ROOT, 'artifacts/designs')
const ARCHIVE_DIR = join(DESIGNS_DIR, '_archive')

const DRY_RUN = process.argv.includes('--dry-run')

// Section classification patterns
const INDEX_PATTERNS = [
  /^summary$/i,
  /^overview$/i,
  /^problem analysis$/i,
  /^current state/i,
  /^priority map$/i,
  /^ptu (character creation|rules)/i,
]

const TESTING_PATTERNS = [
  /^testing strategy$/i,
  /^test plan$/i,
  /^test/i,
]

const IMPL_LOG_PATTERNS = [
  /^implementation log$/i,
  /^resolution log$/i,
  /^tracking$/i,
]

const SHARED_PATTERNS = [
  /^composable/i,
  /^validation utility/i,
  /^changes to existing/i,
  /^component hierarchy/i,
  /^out of scope/i,
  /^implementation order$/i,
  /^implementation notes$/i,
  /^implementation plan$/i,
  /^risk/i,
  /^dependencies$/i,
  /^file change summary$/i,
  /^files to create/i,
  /^files to modify/i,
  /^files changed summary$/i,
  /^migration (plan|strategy)$/i,
  /^performance budget$/i,
  /^open questions/i,
  /^decisions/i,
  /^existing patterns/i,
  /^ptu rule questions$/i,
  /^questions for/i,
  /^what not to change/i,
  /^relationship to/i,
  /^data flow diagram$/i,
  /^edge cases/i,
  /^entity builder/i,
  /^websocket sync$/i,
  /^dependency diagram$/i,
  /^alternatives considered/i,
  /^security/i,
  /^integration sequence/i,
  /^summary$/i,  // numbered section "8. Summary" in integration design
  /^sprite source$/i,
  /^integration points$/i,
]

// Priority tier detection in section titles
const P0_PATTERN = /\(P0\)/i
const P1_PATTERN = /\(P1\)/i
const P2_PATTERN = /\(P2\)/i
const TIER_IN_TITLE_PATTERN = /^P[012]:/i

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { frontmatter: '', body: content, yaml: '' }

  return {
    frontmatter: match[0],
    yaml: match[1],
    body: content.slice(match[0].length),
  }
}

function parseDesignSections(body) {
  const sections = []
  const lines = body.split('\n')
  let currentSection = null

  for (const line of lines) {
    // Detect ## headers (top-level sections in designs start with ##)
    const headerMatch = line.match(/^## (.+)/)
    if (headerMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        title: headerMatch[1].trim(),
        content: line + '\n',
      }
    } else if (currentSection) {
      currentSection.content += line + '\n'
    } else {
      // Content before first ## (title heading, etc.)
      if (!sections._preamble) sections._preamble = ''
      sections._preamble = (sections._preamble || '') + line + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return { preamble: sections._preamble || '', sections }
}

function parsePriorityMap(sections) {
  const mapSection = sections.find((s) => /^priority map$/i.test(s.title))
  if (!mapSection) return null

  const tierMap = {}  // letter -> tier (p0, p1, p2)

  const lines = mapSection.content.split('\n')
  for (const line of lines) {
    // Match table rows like: | A | ... | **P0** |
    const rowMatch = line.match(/\|\s*([A-G])\s*\|.*?\|\s*\**\s*(P[012])\s*\**\s*\|/)
    if (rowMatch) {
      tierMap[rowMatch[1]] = rowMatch[2].toLowerCase()
    }
  }

  return Object.keys(tierMap).length > 0 ? tierMap : null
}

function classifySection(title, priorityMap) {
  // Strip leading number prefix for pattern matching (e.g., "10. Risks" → "Risks")
  const stripped = title.replace(/^\d+\.\s+/, '').replace(/^[A-G]\.\s*/, '')

  // 1. Check if title explicitly has a tier marker: (P0), (P1), (P2) or P0:, P1:, P2:
  if (P0_PATTERN.test(title) || /^P0:/i.test(stripped)) return 'p0'
  if (P1_PATTERN.test(title) || /^P1:/i.test(stripped)) return 'p1'
  if (P2_PATTERN.test(title) || /^P2:/i.test(stripped)) return 'p2'

  // 2. Check if title has a letter prefix and we have a priority map
  if (priorityMap) {
    const letterMatch = title.match(/^([A-G])[\.\s]/)
    if (letterMatch && priorityMap[letterMatch[1]]) {
      return priorityMap[letterMatch[1]]
    }
  }

  // 3. Check against classification patterns (use stripped title for numbered sections)
  const testTitle = stripped || title

  for (const pattern of INDEX_PATTERNS) {
    if (pattern.test(testTitle)) return 'index'
  }

  for (const pattern of IMPL_LOG_PATTERNS) {
    if (pattern.test(testTitle)) return 'implementation-log'
  }

  for (const pattern of TESTING_PATTERNS) {
    if (pattern.test(testTitle)) return 'testing'
  }

  for (const pattern of SHARED_PATTERNS) {
    if (pattern.test(testTitle)) return 'shared'
  }

  // 4. Numbered sections (1. Player Identity, etc.) → spec
  if (/^\d+\.\s/.test(title)) return 'spec'

  // 5. Named sections in designs without tiers → spec
  if (/^(rendering engine|core isometric|data model|architecture)/i.test(title)) return 'spec'
  if (/^(phase plan|solution comparison|recommended|in-session|out-of-session|data sync|conflict resolution|gm setup)/i.test(title)) return 'spec'
  if (/^(technical deep dive|constants|cross-track)/i.test(title)) return 'spec'

  // Default: spec
  return 'spec'
}

function migrateDesign(filename) {
  const filePath = join(DESIGNS_DIR, filename)
  const content = readFileSync(filePath, 'utf-8')
  const designId = filename.replace('.md', '')
  const dirPath = join(DESIGNS_DIR, designId)

  console.log(`\n  Processing ${filename} (${content.split('\n').length} lines)...`)

  const { frontmatter, yaml, body } = parseFrontmatter(content)
  const { preamble, sections } = parseDesignSections(body)
  const priorityMap = parsePriorityMap(sections)

  // Classify all sections
  const classified = {
    index: [],
    p0: [],
    p1: [],
    p2: [],
    spec: [],
    shared: [],
    testing: [],
    'implementation-log': [],
  }

  for (const section of sections) {
    const category = classifySection(section.title, priorityMap)
    classified[category].push(section)
  }

  // Determine if this design uses priority tiers
  const hasTiers = classified.p0.length > 0 || classified.p1.length > 0 || classified.p2.length > 0

  // Build output files
  const outputFiles = {}

  // _index.md: frontmatter + preamble + index sections + tier summary
  let indexContent = frontmatter + '\n'
  if (preamble.trim()) {
    indexContent += preamble.trimEnd() + '\n\n'
  }

  // Add tier summary table
  if (hasTiers) {
    indexContent += '## Tier Summary\n\n'
    indexContent += '| Tier | Sections | File |\n'
    indexContent += '|------|----------|------|\n'
    if (classified.p0.length > 0) {
      indexContent += `| P0 | ${classified.p0.map((s) => s.title.slice(0, 50)).join(', ')} | [spec-p0.md](spec-p0.md) |\n`
    }
    if (classified.p1.length > 0) {
      indexContent += `| P1 | ${classified.p1.map((s) => s.title.slice(0, 50)).join(', ')} | [spec-p1.md](spec-p1.md) |\n`
    }
    if (classified.p2.length > 0) {
      indexContent += `| P2 | ${classified.p2.map((s) => s.title.slice(0, 50)).join(', ')} | [spec-p2.md](spec-p2.md) |\n`
    }
    indexContent += '\n'
  }

  // Add index sections
  for (const section of classified.index) {
    indexContent += section.content
  }

  // Add file listing
  indexContent += '\n## Atomized Files\n\n'
  const fileList = ['_index.md']
  if (hasTiers) {
    if (classified.p0.length > 0) fileList.push('spec-p0.md')
    if (classified.p1.length > 0) fileList.push('spec-p1.md')
    if (classified.p2.length > 0) fileList.push('spec-p2.md')
  }
  if (!hasTiers && classified.spec.length > 0) fileList.push('spec.md')
  if (classified.shared.length > 0) fileList.push('shared-specs.md')
  if (classified.testing.length > 0) fileList.push('testing-strategy.md')
  if (classified['implementation-log'].length > 0) fileList.push('implementation-log.md')
  for (const f of fileList) {
    indexContent += `- [${f}](${f})\n`
  }

  outputFiles['_index.md'] = indexContent

  // Tier spec files
  if (hasTiers) {
    if (classified.p0.length > 0) {
      outputFiles['spec-p0.md'] = `# P0 Specification\n\n` + classified.p0.map((s) => s.content).join('\n')
    }
    if (classified.p1.length > 0) {
      outputFiles['spec-p1.md'] = `# P1 Specification\n\n` + classified.p1.map((s) => s.content).join('\n')
    }
    if (classified.p2.length > 0) {
      outputFiles['spec-p2.md'] = `# P2 Specification\n\n` + classified.p2.map((s) => s.content).join('\n')
    }
  }

  // Untiered spec file
  if (!hasTiers && classified.spec.length > 0) {
    outputFiles['spec.md'] = `# Specification\n\n` + classified.spec.map((s) => s.content).join('\n')
  }

  // Shared specs
  if (classified.shared.length > 0) {
    outputFiles['shared-specs.md'] = `# Shared Specifications\n\n` + classified.shared.map((s) => s.content).join('\n')
  }

  // Testing strategy
  if (classified.testing.length > 0) {
    outputFiles['testing-strategy.md'] = `# Testing Strategy\n\n` + classified.testing.map((s) => s.content).join('\n')
  }

  // Implementation log
  if (classified['implementation-log'].length > 0) {
    outputFiles['implementation-log.md'] = `# Implementation Log\n\n` + classified['implementation-log'].map((s) => s.content).join('\n')
  }

  // Validation
  const totalSections = sections.length
  const classifiedCount = Object.values(classified).reduce((sum, arr) => sum + arr.length, 0)
  if (classifiedCount !== totalSections) {
    console.warn(`    WARNING: ${totalSections} sections found, ${classifiedCount} classified — ${totalSections - classifiedCount} lost!`)
  }

  // Report
  console.log(`    Sections: ${totalSections} total → ${Object.entries(classified).filter(([, v]) => v.length > 0).map(([k, v]) => `${k}(${v.length})`).join(', ')}`)
  console.log(`    Files: ${Object.keys(outputFiles).join(', ')}`)

  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would create ${dirPath}/`)
    for (const [name, content] of Object.entries(outputFiles)) {
      console.log(`      ${name}: ${content.split('\n').length} lines`)
    }
    return { designId, files: Object.keys(outputFiles), sections: totalSections }
  }

  // Create directory
  mkdirSync(dirPath, { recursive: true })

  // Write files
  for (const [name, content] of Object.entries(outputFiles)) {
    writeFileSync(join(dirPath, name), content, 'utf-8')
  }

  // Archive original
  mkdirSync(ARCHIVE_DIR, { recursive: true })
  renameSync(filePath, join(ARCHIVE_DIR, filename))

  console.log(`    Archived original to _archive/${filename}`)

  return { designId, files: Object.keys(outputFiles), sections: totalSections }
}

function main() {
  console.log(`Migrating design docs to atomized structure...`)
  if (DRY_RUN) console.log('(DRY RUN — no files will be changed)\n')

  const files = readdirSync(DESIGNS_DIR)
    .filter((f) => f.startsWith('design-') && f.endsWith('.md') && !f.startsWith('design-_'))
    .sort()

  if (files.length === 0) {
    console.log('No design files found to migrate.')
    process.exit(0)
  }

  console.log(`Found ${files.length} design files to migrate.`)

  const results = []
  for (const file of files) {
    try {
      results.push(migrateDesign(file))
    } catch (err) {
      console.error(`  ERROR migrating ${file}: ${err.message}`)
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`Migrated: ${results.length}/${files.length} designs`)
  for (const r of results) {
    console.log(`  ${r.designId}: ${r.sections} sections → ${r.files.length} files`)
  }

  if (!DRY_RUN) {
    console.log(`\nOriginals archived to: ${ARCHIVE_DIR}`)
    console.log('Run `node scripts/regenerate-artifact-indexes.mjs` to update design index.')
  }
}

main()
