import { execSync } from 'node:child_process'
import { panesEmbed } from '../formatters/embeds.mjs'

export async function handlePanes(interaction) {
  const panes = listSlavePanes()
  await interaction.reply({ embeds: [panesEmbed(panes)] })
}

export function listSlavePanes() {
  try {
    const output = execSync('tmux list-panes -s -t slaves -F "#{window_name}:#{pane_index} #{pane_title} #{pane_pid}"', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim()

    if (!output) return []

    return output.split('\n').map(line => {
      const parts = line.split(' ')
      const target = parts[0]
      const title = parts.slice(1, -1).join(' ')
      const pid = parts[parts.length - 1]
      return { target: `slaves:${target}`, title, pid }
    })
  } catch {
    return []
  }
}
