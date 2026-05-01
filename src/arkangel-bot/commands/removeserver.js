import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData, findServer, postOrUpdatePanel, postAlert } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('removeserver')
  .setDescription('Remove a server from the status panel')
  .addStringOption(opt =>
    opt.setName('server').setDescription('Server name to remove').setRequired(true));

export async function execute(interaction, client, config) {
  const name = interaction.options.getString('server');

  const db = readData();
  const server = findServer(db, name);

  if (!server) {
    return interaction.reply({ content: `❌ Server **"${name}"** not found.`, ephemeral: true });
  }

  db.servers = db.servers.filter(s => s.name.toLowerCase() !== name.toLowerCase());

  writeData(db);
  await postOrUpdatePanel(client, db, config);

  await postAlert(
    client, db,
    `🗑️ **Server Removed — ${server.name}**\n\nRemoved by ${interaction.user} • <t:${Math.floor(Date.now() / 1000)}:t>`
  );

  await interaction.reply({ content: `✅ **${server.name}** has been removed from the panel.`, ephemeral: true });
}
