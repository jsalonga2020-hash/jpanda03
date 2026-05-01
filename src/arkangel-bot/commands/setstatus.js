import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData, findServer, postOrUpdatePanel, postAlert, statusEmoji } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('setstatus')
  .setDescription('Set a server online, offline, or maintenance')
  .addStringOption(opt =>
    opt.setName('server').setDescription('Server name').setRequired(true))
  .addStringOption(opt =>
    opt.setName('status').setDescription('New status').setRequired(true)
      .addChoices(
        { name: '🟩 Online',      value: 'online'      },
        { name: '🟥 Offline',     value: 'offline'     },
        { name: '🟨 Maintenance', value: 'maintenance' },
      ));

export async function execute(interaction, client, config) {
  const name   = interaction.options.getString('server');
  const status = interaction.options.getString('status');

  const db = readData();
  const server = findServer(db, name);

  if (!server) {
    return interaction.reply({ content: `❌ Server **"${name}"** not found. Check the name and try again.`, ephemeral: true });
  }

  const oldStatus = server.status;
  server.status = status;

  // When going offline, mark both services unavailable
  if (status === 'offline') {
    server.xkore0 = false;
    server.xkore3 = false;
  }

  // When coming back from offline, restore services to available
  if (oldStatus === 'offline' && status !== 'offline') {
    server.xkore0 = true;
    server.xkore3 = true;
  }

  writeData(db);
  await postOrUpdatePanel(client, db, config);

  const emoji = statusEmoji(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  await postAlert(
    client, db,
    `🔔 **Status Update — ${server.name}**\n\n${emoji} Status changed to **${label}**\n\nUpdated by ${interaction.user} • <t:${Math.floor(Date.now() / 1000)}:t>`
  );

  await interaction.reply({ content: `✅ **${server.name}** → ${emoji} **${label}**`, ephemeral: true });
}
