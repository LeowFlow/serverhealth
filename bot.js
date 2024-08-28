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
  setInterval(checkMinecraftServerStatus, 120000); //every 2 minutes 120000
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
    const playerCount = data.onlinePlayers;
    const maxPlayers = data.maxPlayers || 'Unknown';
    const serverDescription = data.serverDescription || "No description available.";
    const serverVersion = data.serverVersion || "Unknown";
    const playersData = Array.isArray(data.players) ? data.players : [];
    const isWhitelistEnabled = data.whitelist;

    await updateStatusMessage(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, playersData, isWhitelistEnabled);
    await updateWhitelistChannel(isWhitelistEnabled);

    const newChannelName = `[🟢] Server: Online [${playerCount}/${maxPlayers}]`;
    log(`[LOG] Updating voice channel name to: ${newChannelName}`);

    const voiceChannel = await client.channels.fetch('1273232886543290391', { force: true });

    log(`[LOG] Voice channel before update: ${voiceChannel.name}`);

    await voiceChannel.setName(newChannelName);

    const updatedChannel = await client.channels.fetch('1273232886543290391', { force: true });
    log(`[LOG] Voice channel after update: ${updatedChannel.name}`);

  } catch (error) {
    handleMissedPing();
    log(`[LOG] Error fetching server status: ${error.message}`);
  }
}

async function updateStatusMessage(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, playersData, isWhitelistEnabled) {
  log(`[DEBUG] updateStatusMessage with parameters: playerCount: ${playerCount}, maxPlayers: ${maxPlayers}, serverDescription: ${serverDescription}, serverVersion: ${serverVersion}, players: ${playersData.map(p => p.username).join(', ')}, whitelistEnabled: ${isWhitelistEnabled}`);

  const channel = await client.channels.fetch(config.statusChannelId);
  if (!channel) {
    return log(`[LOG] Status channel with ID ${config.statusChannelId} not found.`);
  }

  const statusEmbed = createStatusEmbed(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverVersion, playersData, isWhitelistEnabled);
  const message = await channel.messages.fetch(statusMessageId);
  
  if (message) {
    await message.edit({ embeds: [statusEmbed] });
    log(`[LOG] Updated status message with player count: ${playerCount} and whitelist status: ${isWhitelistEnabled}`);
  }
}



async function updateWhitelistChannel(isWhitelisted) {
  const whitelistChannelId = config.whitelistChannelId; 
  const channel = await client.channels.fetch(whitelistChannelId);

  if (!channel) {
    return log(`[LOG] Whitelist channel with ID ${whitelistChannelId} not found.`);
  }

  const whitelistStatus = isWhitelisted ? "ON" : "OFF";
  const emoji = isWhitelisted ? "🔒" : "🔓";
  const newChannelName = `${emoji} WHITELIST: ${whitelistStatus}`;

  if (channel.name !== newChannelName) {
    await channel.edit({ name: newChannelName });
    log(`[LOG] Updated whitelist channel name to: ${newChannelName}`);
  } else {
    log(`[LOG] Whitelist channel name is already up to date: ${newChannelName}`);
  }
}


client.login(config.token).catch(err => log(`[LOG] Failed to log in: ${err.message}`));
