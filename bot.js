const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const { updateVoiceChannelName } = require('./utils/channelManager');
const { createStatusEmbed } = require('./utils/statusEmbed');
const { loadUptime, saveUptime } = require('./utils/uptimeManager');
const { log } = require('./utils/logger');

let serverStatus = 'online';
let downtimeStart = null;
let uptimeStart = loadUptime();
let statusMessageId = null;
let missedPings = 0;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  log(`[LOG] Logged in as ${client.user.tag}`);
  try {
    await client.user.setActivity(`IP: ${config.minecraftServerIp}`, { type: 'WATCHING' });
    log(`[LOG] Successfully set activity to: IP: ${config.minecraftServerIp}`);
  } catch (error) {
    log(`[LOG] Failed to set activity: ${error.message}`);
  }

  await initializeStatusMessage();
  setInterval(checkMinecraftServerStatus, 120000); //every 2 minutes
});

async function initializeStatusMessage() {
  const channel = await client.channels.fetch(config.statusChannelId);
  if (!channel) {
    return log(`[LOG] Status channel with ID ${config.statusChannelId} not found.`);
  }

  const messages = await channel.messages.fetch({ limit: 10 });
  const existingMessage = messages.find(msg => msg.author.id === client.user.id);

  if (existingMessage) {
    statusMessageId = existingMessage.id;
    log(`[LOG] Found existing status message with ID: ${statusMessageId}`);
  } else {
    const newMessage = await channel.send({ embeds: [createStatusEmbed(serverStatus, uptimeStart, downtimeStart, 0)] });
    statusMessageId = newMessage.id;
    log(`[LOG] Created new status message with ID: ${statusMessageId}`);
  }
}

async function checkMinecraftServerStatus() {
  try {
    const response = await axios.get('https://servers.api.legacyminecraft.com/api/v1/getServer?uuid=e391569f-490c-3ca1-92bc-167084a37c44');
    const data = response.data;

    log(`[LOG] API Response: ${JSON.stringify(data)}`);

    if (!data.found || data.error) {
      handleMissedPing();
      return;
    }

    const serverStatus = 'online';
    const playerCount = data.onlinePlayers;  // Correctly extracted as number
    const maxPlayers = data.maxPlayers || 'Unknown';
    const serverDescription = data.serverDescription || "No description available.";
    const serverVersion = data.serverVersion || "Unknown";
    const players = data.players ? data.players.map(player => player.username) : [];

    // Debug log to confirm correct extraction
    log(`[DEBUG] Extracted Values - playerCount: ${playerCount}, maxPlayers: ${maxPlayers}, serverDescription: ${serverDescription}, serverVersion: ${serverVersion}, players: ${players}`);

    // Call the updateStatusMessage with correct parameters directly
    updateStatusMessage(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players);

  } catch (error) {
    handleMissedPing();
    log(`[LOG] Error fetching server status: ${error.message}`);
  }
}

async function updateStatusMessage(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players) {
  log(`[DEBUG] updateStatusMessage with parameters: playerCount: ${playerCount}, maxPlayers: ${maxPlayers}, serverDescription: ${serverDescription}, serverVersion: ${serverVersion}, players: ${players}`);

  const channel = await client.channels.fetch(config.statusChannelId);
  if (!channel) {
    return log(`[LOG] Status channel with ID ${config.statusChannelId} not found.`);
  }

  const statusEmbed = createStatusEmbed(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players);
  const message = await channel.messages.fetch(statusMessageId);
  
  if (message) {
    await message.edit({ embeds: [statusEmbed] });
    log(`[LOG] Updated status message with player count: ${playerCount}`);
  }
}

client.login(config.token).catch(err => log(`[LOG] Failed to log in: ${err.message}`));
