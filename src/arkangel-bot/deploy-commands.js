// Run this once with `node deploy-commands.js` to register slash commands with Discord.
// You only need to re-run it when you add or change a command.

import { REST, Routes } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));

const commands = [];
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.token);

try {
  console.log(`Registering ${commands.length} slash commands for guild ${config.guildId}...`);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
  console.log('✅ All slash commands registered successfully.');
} catch (err) {
  console.error('❌ Failed to register commands:', err);
}
