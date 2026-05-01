import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData, findServer, postOrUpdatePanel, postAlert } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('setservice')
  .setDescription('Toggle Xkore0 or Xkore3 availability for a server')
  .addStringOption(opt =>
    opt.setName('server').setDescription('Server name').setRequired(true))
  .addStringOption(opt =>
    opt.setName('service').setDescription('Service to toggle').setRequired(true)
      .addChoices(
        { name: 'Xkore 0', value: 'xkore0' },
        { name: 'Xkore 3', value: 'xkore3' },
      ))
  .addStringOption(opt =>
    opt.setName('availability').setDescription('Available or unavailable').setRequired(true)
      .addChoices(
        { name: '✅ Available',   value: 'available'   },
        { name: '❌ Unavailable', value: 'unavailable' },
      ));

export async function execute(interaction, client, config) {
  const name         = interaction.options.getString('server');
  const service      = interaction.options.getString('service');
  const availability = interaction.options.getString('availability');

  const db = readData();
  const server = findServer(db, name);

  if (!server) {
    return interaction.reply({ content: `❌ Server **"${name}"** not found.`, ephemeral: true });
  }

  if (server.status === 'offline') {
    return interaction.reply({ content: `❌ **${server.name}** is offline. Set it online or maintenance first.`, ephemeral: true });
  }

  const isAvailable = availability === 'available';
  server[service] = isAvailable;

  writeData(db);
  await postOrUpdatePanel(client, db, config);

  const serviceLabel = service === 'xkore0' ? 'Xkore 0' : 'Xkore 3';
  const stateLabel   = isAvailable ? '✅ Available' : '❌ Unavailable';

  await postAlert(
    client, db,
    `🔔 **Service Update — ${server.name}**\n\n${serviceLabel} is now **${isAvailable ? 'Available' : 'Unavailable'}**\n\nUpdated by ${interaction.user} • <t:${Math.floor(Date.now() / 1000)}:t>`
  );

  await interaction.reply({ content: `✅ **${server.name}** — ${serviceLabel} → ${stateLabel}`, ephemeral: true });
}
