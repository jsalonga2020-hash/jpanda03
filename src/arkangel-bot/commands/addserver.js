import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData, findServer, postOrUpdatePanel, postAlert, statusEmoji } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('addserver')
  .setDescription('Add a new server to the status panel')
  .addStringOption(opt =>
    opt.setName('name').setDescription('Server display name').setRequired(true))
  .addStringOption(opt =>
    opt.setName('url').setDescription('Server website URL (https://...)').setRequired(true))
  .addStringOption(opt =>
    opt.setName('status').setDescription('Starting status').setRequired(true)
      .addChoices(
        { name: '🟩 Online',      value: 'online'      },
        { name: '🟥 Offline',     value: 'offline'     },
        { name: '🟨 Maintenance', value: 'maintenance' },
      ));

export async function execute(interaction, client, config) {
  const name   = interaction.options.getString('name');
  const url    = interaction.options.getString('url');
  const status = interaction.options.getString('status');

  const db = readData();

  if (findServer(db, name)) {
    return interaction.reply({ content: `❌ A server named **"${name}"** already exists.`, ephemeral: true });
  }

  // Services default to available unless starting offline
  const active = status !== 'offline';
  db.servers.push({ name, url, status, xkore0: active, xkore3: active });

  writeData(db);
  await postOrUpdatePanel(client, db, config);

  const emoji = statusEmoji(status);

  await postAlert(
    client, db,
    `🆕 **New Server Added — ${name}**\n\n${emoji} Initial status: **${status}**\n\nAdded by ${interaction.user} • <t:${Math.floor(Date.now() / 1000)}:t>`
  );

  await interaction.reply({ content: `✅ **${name}** added to the panel as ${emoji} ${status}.`, ephemeral: true });
}
