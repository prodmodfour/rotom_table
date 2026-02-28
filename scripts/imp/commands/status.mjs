import { resolve } from 'node:path'
import { config } from '../config.mjs'
import { readFileSafe, parseFrontmatter, extractSection } from '../formatters/parsers.mjs'
import { EmbedBuilder } from 'discord.js'

export async function handleStatus(interaction) {
  const devPath = resolve(config.projectRoot, 'artifacts/state/dev-state.md')
  const testPath = resolve(config.projectRoot, 'artifacts/state/test-state.md')

  const devContent = readFileSafe(devPath)
  const testContent = readFileSafe(testPath)

  const embed = new EmbedBuilder()
    .setTitle('Pipeline Status')
    .setColor(0x9b59b6)
    .setTimestamp()

  if (devContent) {
    const { frontmatter } = parseFrontmatter(devContent)
    const activeWork = extractSection(devContent, 'Active Work') || 'No active work section found.'
    embed.addFields(
      { name: 'Dev State', value: `Updated: ${frontmatter.last_updated || '?'}\nBy: ${frontmatter.updated_by || '?'}`, inline: true },
      { name: 'Active Work', value: truncateField(activeWork) }
    )
  } else {
    embed.addFields({ name: 'Dev State', value: 'File not found.', inline: true })
  }

  if (testContent) {
    const { frontmatter } = parseFrontmatter(testContent)
    const nextSteps = extractSection(testContent, 'Recommended Next Steps') || 'None found.'
    embed.addFields(
      { name: 'Test State', value: `Updated: ${frontmatter.last_updated || '?'}\nBy: ${frontmatter.updated_by || '?'}`, inline: true },
      { name: 'Next Steps', value: truncateField(nextSteps) }
    )
  } else {
    embed.addFields({ name: 'Test State', value: 'File not found.', inline: true })
  }

  await interaction.reply({ embeds: [embed] })
}

function truncateField(text) {
  return text.length > 1024 ? text.slice(0, 1021) + '...' : text
}
