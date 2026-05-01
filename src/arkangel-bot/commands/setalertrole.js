import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('setalertrole')
  .setDescription('Set the role that gets pinged when a status changes')
  .addRoleOption(opt =>
    opt.setName('role').setDescription('Role to ping').setRequired(true));

export async function execute(interaction) {
  const role = interaction.options.getRole('role');

  const db = readData();
  db.alertRoleId = role.id;
  writeData(db);

  await interaction.reply({ content: `✅ ${role} will now be pinged on every status change.`, ephemeral: true });
}
