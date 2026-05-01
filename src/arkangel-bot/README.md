# Ragnarok Bot and Blackmarket

Discord server status bot for Ragnarok Online servers. Built with discord.js v14.

---

## Setup

### 1. Install dependencies

```bash
cd src/arkangel-bot
npm install
```

### 2. Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **Bot** → click **Reset Token** → copy the token
4. Under **Privileged Gateway Intents** — no special intents needed
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Manage Messages`
6. Copy the generated URL and invite the bot to your server

### 3. Fill in config.json

```json
{
  "token": "YOUR_BOT_TOKEN",
  "clientId": "YOUR_BOT_APPLICATION_ID",
  "guildId": "YOUR_DISCORD_SERVER_ID",
  "statusChannelId": "CHANNEL_ID_WHERE_PANEL_POSTS",
  "adminRoleId": "ROLE_ID_THAT_CAN_USE_COMMANDS (optional)"
}
```

- **clientId** — found on the application's General Information page
- **guildId** — right-click your Discord server → Copy Server ID (enable Developer Mode in settings first)
- **statusChannelId** — right-click the channel where you want the status panel → Copy Channel ID
- **adminRoleId** — optional; if blank, only users with Administrator permission can use commands

### 4. Register slash commands

```bash
node deploy-commands.js
```

Run this once. Re-run only when you add or change a command.

### 5. Start the bot

```bash
npm start
```

The bot will:
- Post the status panel in your configured channel
- Start the admin dashboard at http://localhost:3000

---

## Slash Commands

| Command | Description |
|---|---|
| `/setstatus <server> <online\|offline\|maintenance>` | Change a server's status |
| `/setservice <server> <xkore0\|xkore3> <available\|unavailable>` | Toggle a service |
| `/addserver <name> <url> <status>` | Add a new server to the panel |
| `/removeserver <server>` | Remove a server from the panel |
| `/setalertchannel <channel>` | Set where status alerts are posted |
| `/setticketchannel <channel>` | Set where the Inquire button points |
| `/setalertrole <role>` | Set which role gets pinged on changes |

All commands require **Administrator** permission or the role set in `adminRoleId`.

---

## Web Dashboard

Open http://localhost:3000 in your browser while the bot is running.

Shows the same data as the Discord panel with clickable server links. Auto-refreshes every 30 seconds.

---

## Files

```
arkangel-bot/
├── index.js              — bot startup and event handling
├── utils.js              — shared embed builder and data helpers
├── deploy-commands.js    — registers slash commands with Discord
├── config.json           — bot token and guild configuration
├── package.json
├── data/
│   └── servers.json      — live status data (persists between restarts)
├── commands/
│   ├── setstatus.js
│   ├── setservice.js
│   ├── addserver.js
│   ├── removeserver.js
│   ├── setalertchannel.js
│   ├── setticketchannel.js
│   └── setalertrole.js
└── dashboard/
    ├── server.js         — Express server for the web dashboard
    └── index.html        — dashboard UI
```
