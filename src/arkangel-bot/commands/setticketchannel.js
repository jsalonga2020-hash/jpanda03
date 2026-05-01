import { SlashCommandBuilder } from 'discord.js';
import { readData, writeData } from '../utils.js';

export const data = new SlashCommandBuilder()
  .setName('setticketchannel')
  .setDescription('Set the channel the Inquire button directs users to')
  .addChannelOption(opt =>
    opt.setName('channel').setDescription('Your support/ticket channel').setRequired(true));

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');

  const db = readData();
  db.ticketChannelId = channel.id;
  writeData(db);

  await interaction.reply({ content: `✅ Inquire button will now direct users to ${channel}.`, ephemeral: true });
}
