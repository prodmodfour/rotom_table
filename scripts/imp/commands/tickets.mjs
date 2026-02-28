import { resolve } from 'node:path'
import { readdirSync, existsSync } from 'node:fs'
import { config } from '../config.mjs'
import { readFileSafe, parseFrontmatter } from '../formatters/parsers.mjs'
import { ticketsEmbed } from '../formatters/embeds.mjs'

const PAGE_SIZE = 15

export async function handleTickets(interaction) {
  const category = interaction.options.getString('category')
  const priority = interaction.options.getString('priority')

  const openDir = resolve(config.projectRoot, 'artifacts/tickets/open')
  const tickets = []

  if (!existsSync(openDir)) {
    await interaction.reply({ embeds: [ticketsEmbed([], category, 1, 1)] })
    return
  }

  const subdirs = readdirSync(openDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  const dirsToScan = category
    ? subdirs.filter(d => d === category)
    : subdirs

  for (const dir of dirsToScan) {
    const dirPath = resolve(openDir, dir)
    const files = readdirSync(dirPath).filter(f => f.endsWith('.md') && f !== '_index.md')

    for (const file of files) {
      const content = readFileSafe(resolve(dirPath, file))
      if (!content) continue

      const { frontmatter } = parseFrontmatter(content)
      const ticket = {
        id: file.replace('.md', ''),
        category: dir,
        title: frontmatter.title || file.replace('.md', ''),
        priority: frontmatter.priority || null,
        severity: frontmatter.severity || null,
        status: frontmatter.status || 'open',
      }

      if (priority && ticket.priority !== priority) continue
      tickets.push(ticket)
    }
  }

  // Sort: P0 first, then P1, etc.
  tickets.sort((a, b) => {
    const pa = a.priority ? parseInt(a.priority.replace('P', '')) : 99
    const pb = b.priority ? parseInt(b.priority.replace('P', '')) : 99
    return pa - pb
  })

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE))
  const page = 1
  const pageTickets = tickets.slice(0, PAGE_SIZE)

  await interaction.reply({ embeds: [ticketsEmbed(pageTickets, category, page, totalPages)] })
}
