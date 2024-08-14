const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const net = require('net');
const path = require('path');
const config = require('./config.json');
const { log, LOGS } = require('./utils/logger');
const { loadUptime, saveUptime } = require('./utils/uptimeManager');
const { updateVoiceChannelName } = require('./utils/channelManager');
const { createStatusEmbed } = require('./utils/statusEmbed');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let serverStatus = 'online';
let downtimeStart = null;
let uptimeStart = loadUptime();
let statusMessageId = null;
let missedPings = 0;
let announcementMessageId = null;

client.once('ready', async () => {
  log(`[LOG] Logged in as ${client.user.tag}`);
  try {
    await client.user.setActivity(`IP: ${config.minecraftServerIp}`, { type: 'WATCHING' });
    log(`[LOG] Successfully set activity to: IP: ${config.minecraftServerIp}`);
  } catch (error) {
    log(`[LOG] Failed to set activity: ${error.message}`);
  }

  await initializeStatusMessage();
  setInterval(checkMinecraftServerStatus, 5000);
  setInterval(updateStatusMessage, 30000);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  // Dynamically load commands
  try {
    const commandFile = require(`./commands/${command.slice(1)}.js`);
    await commandFile.execute(message, args, { serverStatus, uptimeStart, downtimeStart, missedPings, announcementMessageId });
  } catch (error) {
    log(`[LOG] Command not found: ${command}`);
  }
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
    const newMessage = await channel.send({ embeds: [createStatusEmbed(serverStatus, uptimeStart, downtimeStart)] });
    statusMessageId = newMessage.id;
    log(`[LOG] Created new status message with ID: ${statusMessageId}`);
  }
}

async function updateStatusMessage() {
  if (statusMessageId) {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    const statusMessage = await channel.messages.fetch(statusMessageId);
    await statusMessage.edit({ embeds: [createStatusEmbed(serverStatus, uptimeStart, downtimeStart)] });
    log(`[LOG] Updated status message with ID: ${statusMessageId}`);
  }
}

function checkMinecraftServerStatus() {
  const socket = new net.Socket();
  socket.setTimeout(5000);

  socket.connect(config.minecraftServerPort, config.minecraftServerIp, () => {
    if (serverStatus === 'offline' && missedPings >= config.maxMissedPings) {
      uptimeStart = Date.now();
      saveUptime(uptimeStart);
      serverStatus = 'online';
      updateVoiceChannelName(client, '[🟢] MC Server: Online'); // Pass the client object here
      sendServerBackOnlineAlert();
    } else if (serverStatus === 'online') {
      updateVoiceChannelName(client, '[🟢] MC Server: Online'); // Pass the client object here
    }
  
    missedPings = 0;
    updateStatusMessage();
    socket.destroy();
  });

  socket.on('error', handleMissedPing);
  socket.on('timeout', handleMissedPing);
}

function handleMissedPing() {
  missedPings++;
  log(`[LOG] Missed ping: ${missedPings}/${config.maxMissedPings}`);

  if (missedPings >= config.maxMissedPings) {
    if (serverStatus === 'online') {
      downtimeStart = Date.now();
      serverStatus = 'offline';
      updateVoiceChannelName('[🔴] MC Server: Offline');
      sendServerOfflineAlert();
    } else if (serverStatus === 'offline') {
      updateVoiceChannelName('[🔴] MC Server: Offline');
    }
  }
}

client.login(config.token).catch(err => log(`[LOG] Failed to log in: ${err.message}`));
