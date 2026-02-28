import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { config } from '../config.mjs'
import { readJsonSafe } from '../formatters/parsers.mjs'
import { slavesEmbed } from '../formatters/embeds.mjs'

export async function handleSlaves(interaction) {
  const planPath = resolve(config.projectRoot, '.worktrees/slave-plan.json')
  const statusDir = resolve(config.projectRoot, '.worktrees/slave-status')

  const plan = readJsonSafe(planPath)

  if (!plan) {
    await interaction.reply({ embeds: [slavesEmbed(null, [])] })
    return
  }

  const statuses = []
  try {
    const files = readdirSync(statusDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const data = readJsonSafe(resolve(statusDir, file))
      if (data) statuses.push(data)
    }
  } catch {
    // status dir may not exist yet
  }

  statuses.sort((a, b) => (a.slave_id || 0) - (b.slave_id || 0))

  await interaction.reply({ embeds: [slavesEmbed(plan, statuses)] })
}
