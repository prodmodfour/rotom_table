/**
 * Regenerates all _index.md summary files across the artifact ecosystem.
 *
 * Scans artifact directories, parses YAML frontmatter, and writes index files:
 *   - app/tests/e2e/artifacts/_index.md         (global summary)
 *   - app/tests/e2e/artifacts/reviews/_index.md  (review summary)
 *   - app/tests/e2e/artifacts/tickets/_index.md  (ticket summary)
 *   - app/tests/e2e/artifacts/designs/_index.md  (design summary)
 *   - app/tests/e2e/artifacts/matrix/_index.md   (matrix summary)
 *   - decrees/_index.md                          (decree summary)
 *
 * Usage: node scripts/regenerate-artifact-indexes.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, resolve, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..')
const ARTIFACTS = join(ROOT, 'app/tests/e2e/artifacts')
const DECREES_DIR = join(ROOT, 'decrees')

// ---------------------------------------------------------------------------
// YAML Frontmatter Parser (lightweight, no dependencies)
// ---------------------------------------------------------------------------

function parseFrontmatter(filePath) {
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const yaml = match[1]
  const data = {}

  let currentKey = null
  let currentArray = null

  for (const line of yaml.split('\n')) {
    // Array item
    const arrayMatch = line.match(/^  - (.+)/)
    if (arrayMatch && currentKey) {
      if (!currentArray) {
        currentArray = []
        data[currentKey] = currentArray
      }
      currentArray.push(arrayMatch[1].trim())
      continue
    }

    // Nested object field (issues_found)
    const nestedMatch = line.match(/^  (\w+):\s*(.+)/)
    if (nestedMatch && currentKey && !currentArray) {
      if (data[currentKey] == null || typeof data[currentKey] !== 'object' || Array.isArray(data[currentKey])) {
        data[currentKey] = {}
      }
      data[currentKey][nestedMatch[1]] = parseValue(nestedMatch[2])
      continue
    }

    // Top-level key-value
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

  return data
}

function parseValue(raw) {
  if (raw === 'null' || raw === '~') return null
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  if (/^\d+\.\d+$/.test(raw)) return parseFloat(raw)
  // Strip surrounding quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }
  // Inline array: [a, b, c]
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map((s) => parseValue(s.trim()))
      .filter((s) => s !== '')
  }
  return raw
}

// ---------------------------------------------------------------------------
// Directory Scanning Helpers
// ---------------------------------------------------------------------------

function listMdFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== '_index.md' && f !== '.gitkeep')
    .sort()
}

function readAllFrontmatter(dir) {
  return listMdFiles(dir).map((f) => {
    const fm = parseFrontmatter(join(dir, f))
    return {
      file: f,
      _id: f.replace('.md', ''), // fallback ID from filename
      ...fm,
    }
  })
}

function getSummary(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n*/, '')

    // Try the first heading — skip generic ones like "## Summary"
    const firstHeading = afterFrontmatter.match(/^#+ (.+)/m)
    if (firstHeading && firstHeading[1].trim().toLowerCase() !== 'summary') {
      return firstHeading[1].trim()
    }

    // Fall back to first non-empty paragraph after frontmatter
    const lines = afterFrontmatter.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('-')) {
        return trimmed
      }
    }
    return ''
  } catch {
    return ''
  }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Index Generators
// ---------------------------------------------------------------------------

function generateReviewsIndex() {
  const dir = join(ARTIFACTS, 'reviews')
  const activeDir = join(dir, 'active')
  const archiveDir = join(dir, 'archive')

  // Read from active/ subdirectory (new structure) or flat directory (fallback)
  const activeReviewFiles = existsSync(activeDir) ? readAllFrontmatter(activeDir) : []
  const flatReviewFiles = existsSync(activeDir) ? [] : readAllFrontmatter(dir)

  // Count archived reviews
  let archivedCount = 0
  if (existsSync(archiveDir)) {
    for (const subdir of readdirSync(archiveDir)) {
      const subdirPath = join(archiveDir, subdir)
      try {
        if (statSync(subdirPath).isDirectory()) {
          archivedCount += listMdFiles(subdirPath).length
        }
      } catch { /* skip */ }
    }
  }

  const reviews = activeReviewFiles.length > 0 ? activeReviewFiles : flatReviewFiles

  const active = reviews.filter((r) => {
    const verdict = r.verdict || r.result
    return (
      verdict === 'CHANGES_REQUIRED' ||
      verdict === 'FAIL' ||
      verdict === 'MIXED'
    )
  })

  const approved = reviews
    .filter((r) => {
      const verdict = r.verdict || r.result
      return verdict === 'APPROVED' || verdict === 'PASS'
    })
    .sort((a, b) => {
      const idA = parseInt((a.review_id || '').replace(/\D/g, '')) || 0
      const idB = parseInt((b.review_id || '').replace(/\D/g, '')) || 0
      return idB - idA
    })

  // Latest review per target (ticket/report)
  const latestByTarget = new Map()
  for (const r of reviews) {
    const target = r.ticket_id || r.target_report || 'unknown'
    const id = parseInt((r.review_id || r._id || '').replace(/\D/g, '')) || 0
    const existing = latestByTarget.get(target)
    if (!existing || id > existing.id) {
      latestByTarget.set(target, { id, review: r })
    }
  }

  let out = `---\ngenerated_at: ${new Date().toISOString()}\ntotal_reviews: ${reviews.length}\nactive_count: ${active.length}\napproved_count: ${approved.length}\n---\n\n`
  out += `# Reviews Index\n\n`

  // Active reviews requiring action
  out += `## Active Reviews (${active.length})\n\n`
  if (active.length > 0) {
    out += `| Review ID | Verdict | Target | Reviewer | Date |\n`
    out += `|-----------|---------|--------|----------|------|\n`
    for (const r of active) {
      const verdict = r.verdict || r.result || '?'
      const target = r.ticket_id || r.target_report || '—'
      const reviewer = r.reviewer || '—'
      const date = r.date || r.reviewed_at || '—'
      out += `| ${r.review_id || r._id} | ${verdict} | ${target} | ${reviewer} | ${String(date).slice(0, 10)} |\n`
    }
  } else {
    out += `No active reviews requiring action.\n`
  }

  // Recent approved (last 10)
  out += `\n## Recently Approved (last 10)\n\n`
  const recentApproved = approved.slice(0, 10)
  if (recentApproved.length > 0) {
    out += `| Review ID | Target | Reviewer | Date |\n`
    out += `|-----------|--------|----------|------|\n`
    for (const r of recentApproved) {
      const target = r.ticket_id || r.target_report || '—'
      const reviewer = r.reviewer || '—'
      const date = r.date || r.reviewed_at || '—'
      out += `| ${r.review_id || r._id} | ${target} | ${reviewer} | ${String(date).slice(0, 10)} |\n`
    }
  }

  out += `\n## Stats\n\n`
  out += `- Active reviews: ${reviews.length}\n`
  out += `- Needs action: ${active.length}\n`
  out += `- Approved/Pass (active): ${approved.length}\n`
  out += `- Archived: ${archivedCount}\n`
  out += `- Total (active + archived): ${reviews.length + archivedCount}\n`
  out += `- Unique targets reviewed: ${latestByTarget.size}\n`

  return out
}

function generateTicketsIndex() {
  const categories = ['bug', 'ptu-rule', 'feature', 'ux', 'decree', 'refactoring']
  const statusDirs = ['open', 'in-progress', 'resolved']
  const allTickets = []

  // New structure: tickets/{status}/{category}/
  const hasNewStructure = existsSync(join(ARTIFACTS, 'tickets', 'open'))

  if (hasNewStructure) {
    for (const status of statusDirs) {
      for (const cat of categories) {
        const dir = join(ARTIFACTS, 'tickets', status, cat)
        const tickets = readAllFrontmatter(dir)
        for (const t of tickets) {
          allTickets.push({ ...t, category: cat })
        }
      }
    }
  } else {
    // Fallback: old flat structure tickets/{category}/
    for (const cat of categories) {
      const dir = join(ARTIFACTS, 'tickets', cat)
      const tickets = readAllFrontmatter(dir)
      for (const t of tickets) {
        allTickets.push({ ...t, category: cat })
      }
    }
  }

  const open = allTickets.filter((t) => t.status === 'open')
  const inProgress = allTickets.filter((t) => t.status === 'in-progress')
  const resolved = allTickets.filter((t) => t.status === 'resolved' || t.status === 'addressed' || t.status === 'implemented')

  // Sort by priority
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 }
  const sortByPriority = (a, b) =>
    (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5)

  open.sort(sortByPriority)
  inProgress.sort(sortByPriority)

  let out = `---\ngenerated_at: ${new Date().toISOString()}\ntotal_tickets: ${allTickets.length}\nopen: ${open.length}\nin_progress: ${inProgress.length}\nresolved: ${resolved.length}\n---\n\n`
  out += `# Tickets Index\n\n`

  // Open tickets
  out += `## Open Tickets (${open.length})\n\n`
  if (open.length > 0) {
    out += `| ID | Category | Priority | Domain | Summary |\n`
    out += `|----|----------|----------|--------|--------|\n`
    for (const t of open) {
      const id = t.ticket_id || t.id || t.file.replace('.md', '')
      // Try new structure first, fallback to old
      const ticketPath = hasNewStructure
        ? join(ARTIFACTS, 'tickets', 'open', t.category, t.file)
        : join(ARTIFACTS, 'tickets', t.category, t.file)
      const summary = getSummary(ticketPath).slice(0, 60)
      out += `| ${id} | ${t.category} | ${t.priority || '—'} | ${t.domain || '—'} | ${summary} |\n`
    }
  } else {
    out += `No open tickets.\n`
  }

  // In-progress tickets
  out += `\n## In-Progress Tickets (${inProgress.length})\n\n`
  if (inProgress.length > 0) {
    out += `| ID | Category | Priority | Domain | Source |\n`
    out += `|----|----------|----------|--------|--------|\n`
    for (const t of inProgress) {
      const id = t.ticket_id || t.id || t.file.replace('.md', '')
      out += `| ${id} | ${t.category} | ${t.priority || '—'} | ${t.domain || '—'} | ${t.source || '—'} |\n`
    }
  } else {
    out += `No in-progress tickets.\n`
  }

  // Decree-need tickets (open)
  const openDecrees = allTickets.filter(
    (t) => t.category === 'decree' && (t.status === 'open' || !t.status)
  )
  out += `\n## Open Decree-Needs (${openDecrees.length})\n\n`
  if (openDecrees.length > 0) {
    out += `| ID | Priority | Domain | Topic |\n`
    out += `|----|----------|--------|-------|\n`
    for (const t of openDecrees) {
      const id = t.ticket_id || t.file.replace('.md', '')
      out += `| ${id} | ${t.priority || '—'} | ${t.domain || '—'} | ${t.topic || '—'} |\n`
    }
  } else {
    out += `All decree-needs addressed.\n`
  }

  // Summary by category and status
  out += `\n## Summary by Category\n\n`
  out += `| Category | Open | In-Progress | Resolved | Total |\n`
  out += `|----------|------|-------------|----------|-------|\n`
  for (const cat of categories) {
    const catTickets = allTickets.filter((t) => t.category === cat)
    const catOpen = catTickets.filter((t) => t.status === 'open').length
    const catIP = catTickets.filter((t) => t.status === 'in-progress').length
    const catResolved = catTickets.filter(
      (t) => t.status === 'resolved' || t.status === 'addressed' || t.status === 'implemented'
    ).length
    out += `| ${cat} | ${catOpen} | ${catIP} | ${catResolved} | ${catTickets.length} |\n`
  }

  return out
}

function generateDesignsIndex() {
  const dir = join(ARTIFACTS, 'designs')
  const designs = []

  // Detect atomized structure: design directories with _index.md
  const entries = existsSync(dir) ? readdirSync(dir) : []
  const designDirs = entries.filter((e) => {
    try {
      return e.startsWith('design-') && statSync(join(dir, e)).isDirectory() && existsSync(join(dir, e, '_index.md'))
    } catch { return false }
  })

  if (designDirs.length > 0) {
    // Atomized: read _index.md from each design directory
    for (const d of designDirs) {
      const fm = parseFrontmatter(join(dir, d, '_index.md'))
      designs.push({ ...fm, _id: d, file: d })
    }
  } else {
    // Fallback: flat design files
    const flat = readAllFrontmatter(dir)
    designs.push(...flat)
  }

  let out = `---\ngenerated_at: ${new Date().toISOString()}\ntotal_designs: ${designs.length}\n---\n\n`
  out += `# Designs Index\n\n`

  out += `| Design ID | Domain | Status | Ticket | Scope | Category |\n`
  out += `|-----------|--------|--------|--------|-------|----------|\n`

  for (const d of designs) {
    const id = d.design_id || d._id || d.file.replace('.md', '')
    out += `| ${id} | ${d.domain || '—'} | ${d.status || '—'} | ${d.ticket_id || '—'} | ${d.scope || '—'} | ${d.category || '—'} |\n`
  }

  return out
}

function generateMatrixIndex() {
  const dir = join(ARTIFACTS, 'matrix')

  // Detect structure: atomized (domain subdirectories) or monolithic (flat files)
  const entries = existsSync(dir) ? readdirSync(dir) : []
  const domainDirs = entries.filter((e) => {
    try { return statSync(join(dir, e)).isDirectory() && e !== '_archive' }
    catch { return false }
  })

  const domains = new Map()

  if (domainDirs.length > 0) {
    // Atomized structure: read _index.md from each domain subdirectory
    for (const domain of domainDirs) {
      const domainPath = join(dir, domain)
      const info = { rules: null, capabilities: null, matrix: false, audit: null }

      // Read rules _index.md
      const rulesIdx = join(domainPath, 'rules', '_index.md')
      if (existsSync(rulesIdx)) info.rules = parseFrontmatter(join(domainPath, 'rules', '_index.md'))

      // Read capabilities _index.md
      const capsIdx = join(domainPath, 'capabilities', '_index.md')
      if (existsSync(capsIdx)) info.capabilities = parseFrontmatter(join(domainPath, 'capabilities', '_index.md'))

      // Check matrix.md existence
      info.matrix = existsSync(join(domainPath, 'matrix.md'))

      // Read audit _index.md
      const auditIdx = join(domainPath, 'audit', '_index.md')
      if (existsSync(auditIdx)) info.audit = parseFrontmatter(join(domainPath, 'audit', '_index.md'))

      // Read matrix.md for coverage
      if (info.matrix) {
        try {
          const content = readFileSync(join(domainPath, 'matrix.md'), 'utf-8')
          const scoreMatch = content.match(/(?:Coverage|Score)[:\s]*(\d+(?:\.\d+)?)\s*%/i)
          if (scoreMatch) info.coverage = `${scoreMatch[1]}%`
        } catch { /* skip */ }
      }

      domains.set(domain, info)
    }
  } else {
    // Fallback: monolithic flat files (pre-migration)
    const files = readAllFrontmatter(dir)
    for (const f of files) {
      const domain = f.domain
      if (!domain) continue
      if (!domains.has(domain)) domains.set(domain, { rules: null, capabilities: null, matrix: false, audit: null })
      const d = domains.get(domain)
      if (f.file.endsWith('-rules.md')) d.rules = f
      else if (f.file.endsWith('-capabilities.md')) d.capabilities = f
      else if (f.file.endsWith('-matrix.md')) d.matrix = true
      else if (f.file.endsWith('-audit.md')) d.audit = f
    }
  }

  let out = `---\ngenerated_at: ${new Date().toISOString()}\ntotal_domains: ${domains.size}\n---\n\n`
  out += `# Matrix Index\n\n`

  out += `| Domain | Rules | Capabilities | Matrix | Audit | Coverage | Last Updated |\n`
  out += `|--------|-------|-------------|--------|-------|----------|-------------|\n`

  for (const [domain, d] of [...domains.entries()].sort()) {
    const ruleCount = d.rules?.total_rules ?? '—'
    const capCount = d.capabilities?.total_capabilities ?? '—'
    const coverage = d.coverage ?? '—'

    // Audit stats
    let auditSummary = '—'
    if (d.audit) {
      const total = d.audit.total_audited ?? d.audit.items_audited ?? 0
      const correct = d.audit.correct ?? '?'
      const incorrect = d.audit.incorrect ?? 0
      if (total > 0) {
        auditSummary = `${correct}/${total} correct${incorrect > 0 ? `, ${incorrect} incorrect` : ''}`
      } else {
        auditSummary = 'audited'
      }
    }

    // Latest update timestamp
    const timestamps = [
      d.rules?.extracted_at,
      d.capabilities?.mapped_at,
      d.audit?.audited_at,
    ].filter(Boolean)
    const latest = timestamps.length > 0
      ? timestamps.sort().pop().toString().slice(0, 10)
      : '—'

    const hasRules = d.rules != null
    const hasCaps = d.capabilities != null
    const hasAudit = d.audit != null
    const pipelineStatus = (hasRules && hasCaps && d.matrix && hasAudit) ? 'complete' : 'partial'

    out += `| ${domain} | ${ruleCount} rules | ${capCount} caps | ${pipelineStatus} | ${auditSummary} | ${coverage} | ${latest} |\n`
  }

  return out
}

function generateDecreesIndex() {
  const decrees = readAllFrontmatter(DECREES_DIR)

  const active = decrees.filter((d) => d.status === 'active')
  const superseded = decrees.filter((d) => d.status === 'superseded')

  let out = `---\ngenerated_at: ${new Date().toISOString()}\ntotal_decrees: ${decrees.length}\nactive: ${active.length}\nsuperseded: ${superseded.length}\n---\n\n`
  out += `# Decrees Index\n\n`

  out += `## Active Decrees (${active.length})\n\n`
  if (active.length > 0) {
    out += `| Decree ID | Domain | Topic | Title |\n`
    out += `|-----------|--------|-------|-------|\n`
    for (const d of active) {
      out += `| ${d.decree_id} | ${d.domain || '—'} | ${d.topic || '—'} | ${d.title || '—'} |\n`
    }
  }

  if (superseded.length > 0) {
    out += `\n## Superseded Decrees (${superseded.length})\n\n`
    out += `| Decree ID | Superseded By | Domain | Topic |\n`
    out += `|-----------|---------------|--------|-------|\n`
    for (const d of superseded) {
      out += `| ${d.decree_id} | ${d.superseded_by || '—'} | ${d.domain || '—'} | ${d.topic || '—'} |\n`
    }
  }

  return out
}

function generateGlobalIndex() {
  // Gather high-level counts from all categories
  const reviewDir = join(ARTIFACTS, 'reviews')
  const reviewActiveDir = join(reviewDir, 'active')
  const reviewFiles = existsSync(reviewActiveDir) ? listMdFiles(reviewActiveDir) : listMdFiles(reviewDir)
  const reviewData = existsSync(reviewActiveDir) ? readAllFrontmatter(reviewActiveDir) : readAllFrontmatter(reviewDir)
  const activeReviews = reviewData.filter((r) => {
    const v = r.verdict || r.result
    return v === 'CHANGES_REQUIRED' || v === 'FAIL' || v === 'MIXED'
  })

  const ticketCategories = ['bug', 'ptu-rule', 'feature', 'ux', 'decree', 'refactoring']
  const statusDirs = ['open', 'in-progress', 'resolved']
  let totalTickets = 0
  let openTickets = 0
  let inProgressTickets = 0
  const openByPriority = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 }

  const hasNewTicketStructure = existsSync(join(ARTIFACTS, 'tickets', 'open'))

  if (hasNewTicketStructure) {
    for (const status of statusDirs) {
      for (const cat of ticketCategories) {
        const tickets = readAllFrontmatter(join(ARTIFACTS, 'tickets', status, cat))
        totalTickets += tickets.length
        if (status === 'open') {
          openTickets += tickets.length
          for (const t of tickets) {
            if (t.priority && openByPriority[t.priority] !== undefined) {
              openByPriority[t.priority]++
            }
          }
        } else if (status === 'in-progress') {
          inProgressTickets += tickets.length
        }
      }
    }
  } else {
    for (const cat of ticketCategories) {
      const tickets = readAllFrontmatter(join(ARTIFACTS, 'tickets', cat))
      totalTickets += tickets.length
      for (const t of tickets) {
        if (t.status === 'open') {
          openTickets++
          if (t.priority && openByPriority[t.priority] !== undefined) {
            openByPriority[t.priority]++
          }
        } else if (t.status === 'in-progress') {
          inProgressTickets++
        }
      }
    }
  }

  // Designs: count atomized directories or flat files
  const designsDir = join(ARTIFACTS, 'designs')
  const designEntries = existsSync(designsDir) ? readdirSync(designsDir) : []
  const designDirCount = designEntries.filter((e) => {
    try { return e.startsWith('design-') && statSync(join(designsDir, e)).isDirectory() }
    catch { return false }
  }).length
  const designCount = designDirCount > 0 ? designDirCount : listMdFiles(designsDir).length
  const decreeFiles = listMdFiles(DECREES_DIR)
  const refactoringFiles = listMdFiles(join(ARTIFACTS, 'refactoring'))

  // Matrix: count domain subdirectories (atomized) or flat files (legacy)
  const matrixDir = join(ARTIFACTS, 'matrix')
  const matrixEntries = existsSync(matrixDir) ? readdirSync(matrixDir) : []
  const matrixDomainDirs = matrixEntries.filter((e) => {
    try { return statSync(join(matrixDir, e)).isDirectory() && e !== '_archive' }
    catch { return false }
  })
  const matrixCount = matrixDomainDirs.length > 0
    ? matrixDomainDirs.length
    : listMdFiles(matrixDir).length

  // Open decree-needs
  const decreeNeedsDir = existsSync(join(ARTIFACTS, 'tickets', 'open', 'decree'))
    ? join(ARTIFACTS, 'tickets', 'open', 'decree')
    : join(ARTIFACTS, 'tickets', 'decree')
  const decreeNeeds = readAllFrontmatter(decreeNeedsDir)
  const openDecreeNeeds = decreeNeeds.filter((d) => d.status === 'open' || !d.status)

  let out = `---\ngenerated_at: ${new Date().toISOString()}\n---\n\n`
  out += `# Artifact Ecosystem Index\n\n`

  out += `## Open Work Summary\n\n`
  out += `| Category | Count |\n`
  out += `|----------|-------|\n`
  out += `| Active reviews (CHANGES_REQUIRED/FAIL) | ${activeReviews.length} |\n`
  out += `| Open tickets | ${openTickets} |\n`
  out += `| In-progress tickets | ${inProgressTickets} |\n`
  out += `| Open decree-needs | ${openDecreeNeeds.length} |\n`

  out += `\n## Open Tickets by Priority\n\n`
  out += `| Priority | Count |\n`
  out += `|----------|-------|\n`
  for (const [p, count] of Object.entries(openByPriority)) {
    if (count > 0) out += `| ${p} | ${count} |\n`
  }

  if (activeReviews.length > 0) {
    out += `\n## Active Reviews Requiring Action\n\n`
    out += `| Review ID | Verdict | Target |\n`
    out += `|-----------|---------|--------|\n`
    for (const r of activeReviews) {
      const v = r.verdict || r.result
      const target = r.ticket_id || r.target_report || '—'
      out += `| ${r.review_id || r._id} | ${v} | ${target} |\n`
    }
  }

  out += `\n## Artifact Counts\n\n`
  out += `| Directory | Files |\n`
  out += `|-----------|-------|\n`
  out += `| reviews/ | ${reviewFiles.length} |\n`
  out += `| tickets/ (all) | ${totalTickets} |\n`
  out += `| designs/ | ${designCount} |\n`
  out += `| matrix/ | ${matrixCount}${matrixDomainDirs.length > 0 ? ' domains' : ''} |\n`
  out += `| refactoring/ | ${refactoringFiles.length} |\n`
  out += `| decrees/ | ${decreeFiles.length} |\n`

  out += `\n## Sub-Indexes\n\n`
  out += `- [Reviews](reviews/_index.md)\n`
  out += `- [Tickets](tickets/_index.md)\n`
  out += `- [Designs](designs/_index.md)\n`
  out += `- [Matrix](matrix/_index.md)\n`
  out += `- [Decrees](../../decrees/_index.md)\n`

  return out
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Regenerating artifact indexes...\n')

  const indexes = [
    {
      name: 'Global artifacts',
      path: join(ARTIFACTS, '_index.md'),
      generate: generateGlobalIndex,
    },
    {
      name: 'Reviews',
      path: join(ARTIFACTS, 'reviews', '_index.md'),
      generate: generateReviewsIndex,
    },
    {
      name: 'Tickets',
      path: join(ARTIFACTS, 'tickets', '_index.md'),
      generate: generateTicketsIndex,
    },
    {
      name: 'Designs',
      path: join(ARTIFACTS, 'designs', '_index.md'),
      generate: generateDesignsIndex,
    },
    {
      name: 'Matrix',
      path: join(ARTIFACTS, 'matrix', '_index.md'),
      generate: generateMatrixIndex,
    },
    {
      name: 'Decrees',
      path: join(DECREES_DIR, '_index.md'),
      generate: generateDecreesIndex,
    },
  ]

  let successCount = 0
  for (const idx of indexes) {
    try {
      const content = idx.generate()
      writeFileSync(idx.path, content, 'utf-8')
      console.log(`  ✓ ${idx.name} → ${idx.path.replace(ROOT + '/', '')}`)
      successCount++
    } catch (err) {
      console.error(`  ✗ ${idx.name} failed: ${err.message}`)
    }
  }

  console.log(`\nDone: ${successCount}/${indexes.length} indexes generated.`)
  process.exit(successCount === indexes.length ? 0 : 1)
}

main()
