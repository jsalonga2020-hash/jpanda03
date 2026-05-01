import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readData, postOrUpdatePanel } from './utils.js';
import { startDashboard } from './dashboard/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Store all slash commands in a Collection for fast lookup
client.commands = new Collection();

// Dynamically load every file in /commands
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);

  // Start the local web dashboard on port 3000
  startDashboard();

  // Post or refresh the status panel in the configured channel
  const data = readData();
  const channelId = data.statusChannelId || config.statusChannelId;
  if (channelId) {
    if (!data.statusChannelId) data.statusChannelId = config.statusChannelId;
    await postOrUpdatePanel(client, data, config);
    console.log('✅ Status panel is live.');
  } else {
    console.log('⚠️  Set statusChannelId in config.json to activate the panel.');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {

  // ── Slash commands ──────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Only Administrators or the configured admin role may use these commands
    const data = readData();
    const isAdmin = interaction.member.permissions.has('Administrator');
    const hasRole = config.adminRoleId && interaction.member.roles.cache.has(config.adminRoleId);

    if (!isAdmin && !hasRole) {
      return interaction.reply({
        content: '❌ You need **Administrator** permissions to use this command.',
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction, client, config);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);
      const msg = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(console.error);
      } else {
        await interaction.reply(msg).catch(console.error);
      }
    }
  }

  // ── Inquire button ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'inquire_button') {
    const data = readData();
    const reply = data.ticketChannelId
      ? `📩 Head over to <#${data.ticketChannelId}> for support and inquiries!`
      : '📩 Please contact a staff member for support.';

    await interaction.reply({ content: reply, ephemeral: true });
  }
});

client.login(config.token);
