import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'data/servers.json');

export function readData() {
  return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
}

export function writeData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Find a server by name (case-insensitive)
export function findServer(data, name) {
  return data.servers.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function buildEmbed(data) {
  // Color: red if any offline, yellow if any maintenance, green if all online
  let color = 0x57F287;
  for (const s of data.servers) {
    if (s.status === 'offline') { color = 0xED4245; break; }
    if (s.status === 'maintenance') color = 0xFEE75C;
  }

  let description = '🟩 – Working   🟥 – Needs Update   🟨 – Maintenance\n\n';
  description += '**Modes Available:**\n';
  description += '`0` Xkore 0 = Bot without client\n';
  description += '`3` Xkore 3 = Bot with open client\n\n';
  description += '──────────────────────────────────────\n\n';

  for (const server of data.servers) {
    // Clickable server name via Discord masked link
    let line = `• [${server.name}](${server.url})  `;

    if (server.status === 'online')      line += '🟩';
    else if (server.status === 'offline')     line += '🟥';
    else if (server.status === 'maintenance') line += '🟨';

    // Only show service badges when not fully offline
    if (server.status !== 'offline') {
      if (server.xkore0) line += '  `0`';
      if (server.xkore3) line += '  `3`';
    }

    description += line + '\n';
  }

  return new EmbedBuilder()
    .setTitle('📡  Ragnarok Bot and Blackmarket')
    .setDescription(description)
    .setColor(color);
}

export function buildRow() {
  const button = new ButtonBuilder()
    .setCustomId('inquire_button')
    .setLabel('📩  Inquire / Support')
    .setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(button);
}

// Edit the existing panel message or post a new one if it no longer exists
export async function postOrUpdatePanel(client, data, config) {
  const channelId = data.statusChannelId || config?.statusChannelId;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const embed = buildEmbed(data);
  const row = buildRow();

  if (data.statusMessageId) {
    try {
      const msg = await channel.messages.fetch(data.statusMessageId);
      await msg.edit({ embeds: [embed], components: [row] });
      return;
    } catch {
      // Message was deleted — fall through to post a new one
    }
  }

  const msg = await channel.send({ embeds: [embed], components: [row] });
  data.statusMessageId = msg.id;
  writeData(data);
}

// Post an alert to the alert channel with optional role ping
export async function postAlert(client, data, message) {
  if (!data.alertChannelId) return;

  const channel = await client.channels.fetch(data.alertChannelId).catch(() => null);
  if (!channel) return;

  const ping = data.alertRoleId ? `<@&${data.alertRoleId}> ` : '';
  await channel.send(`${ping}${message}`).catch(console.error);
}

// Format a status string into its display emoji
export function statusEmoji(status) {
  if (status === 'online')      return '🟩';
  if (status === 'offline')     return '🟥';
  if (status === 'maintenance') return '🟨';
  return '❓';
}
