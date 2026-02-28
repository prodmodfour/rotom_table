import { resolve } from 'node:path'
import { config } from '../config.mjs'
import { readFileSafe, parseMarkdownTable } from '../formatters/parsers.mjs'
import { coverageEmbed } from '../formatters/embeds.mjs'

export async function handleCoverage(interaction) {
  const testPath = resolve(config.projectRoot, 'artifacts/state/test-state.md')
  const content = readFileSafe(testPath)

  if (!content) {
    await interaction.reply({ content: 'test-state.md not found.' })
    return
  }

  // Extract the Domain Progress table
  const tableStart = content.indexOf('| Domain')
  if (tableStart === -1) {
    await interaction.reply({ content: 'No Domain Progress table found in test-state.md.' })
    return
  }

  // Find the end of the table (next blank line or non-table line)
  const afterTable = content.slice(tableStart)
  const lines = afterTable.split('\n')
  const tableLines = []
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      tableLines.push(line)
    } else if (tableLines.length > 0) {
      break
    }
  }

  const { rows } = parseMarkdownTable(tableLines.join('\n'))

  await interaction.reply({ embeds: [coverageEmbed(rows)] })
}
