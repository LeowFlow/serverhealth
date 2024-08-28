# Old School Minecraft Server Tracker Bot

## Features

- Real-time server status tracking.
- Alerts for whitelist mode with direct channel links.
- Player count and server version display.
- Interactive Discord embeds.

## Dependencies

Before you can run the bot, ensure you have the following dependencies installed:

- **Node.js** (v14.x or higher) - JavaScript runtime environment.
- **npm** - Node package manager, usually installed with Node.js.
- **discord.js** - Discord API library for JavaScript.
- **axios** - Promise-based HTTP client for making requests.
- **dotenv** - Module to load environment variables from a `.env` file.
- **nodemon** (optional) - Tool that automatically restarts the bot when file changes are detected (useful for development).


Create and Configure config.json:

Create a config.json file in the root of your project directory. This file should include the following configuration options:

```
{
  "token": "TOKEN_HERE",
  "guildId": "549321864443592724",
  "voiceChannelId": "1273232886543290391",
  "announcementChannelId": "638836089607684141",
  "statusChannelId": "867478353094639646",
  "whitelistChannelId": "1278335788668682344",
  "minecraftServerIp": "os-mc.net",
  "minecraftServerPort": 25565,
  "adminRoleId": "123456789012345678",
  "maxMissedPings": 10,
  "uptimeFile": "uptime.json"
}

```







