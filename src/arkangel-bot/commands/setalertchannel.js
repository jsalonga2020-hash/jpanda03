import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('setalertchannel')
  .setDescription('Set the channel where status change alerts are posted')
  .addChannelOption(opt =>
    opt.setName('channel').setDescription('Target channel').setRequired(true));

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');

  const db = readData();
  db.alertChannelId = channel.id;
  writeData(db);

  await interaction.reply({ content: `✅ Alert channel set to ${channel}.`, ephemeral: true });
}
