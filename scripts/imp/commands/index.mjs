import { handleStatus } from './status.mjs'
import { handleSlaves } from './slaves.mjs'
import { handleTickets } from './tickets.mjs'
import { handleCoverage } from './coverage.mjs'
import { handlePanes } from './panes.mjs'

const COMMAND_HANDLERS = {
  status: handleStatus,
  slaves: handleSlaves,
  tickets: handleTickets,
  coverage: handleCoverage,
  panes: handlePanes,
}

export function registerCommands(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return

    const handler = COMMAND_HANDLERS[interaction.commandName]
    if (!handler) return

    try {
      await handler(interaction)
    } catch (error) {
      console.error(`Command /${interaction.commandName} failed:`, error)
      const reply = { content: `Command failed: ${error.message}`, ephemeral: true }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply)
      } else {
        await interaction.reply(reply)
      }
    }
  })
}
