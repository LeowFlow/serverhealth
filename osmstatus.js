const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const net = require('net');

const TOKEN = 'MTI3MjkzNTkzNjk5MjIxNTA0MA.GV4kW6.AsimgsKws6TLVtD1xl1Ua5WVFOlU09ojBJfFOo'; // oh noes please dont steal my token!!!!
const GUILD_ID = '549321864443592724'; //OSM Guild ID 
const VOICE_CHANNEL_ID = '1273232886543290391'; 
const ANNOUNCEMENT_CHANNEL_ID = '638836089607684141'; //#general channel 
const STATUS_CHANNEL_ID = '867478353094639646'; //#server-info channel

const MINECRAFT_SERVER_IP = 'os-mc.net';
const MINECRAFT_SERVER_PORT = 25565;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let serverStatus = 'online';
let downtimeStart = null;
let uptimeStart = Date.now();
let statusMessageId = null;
let missedPings = 0;
let announcementMessageId = null; // Track the ID of the announcement message
const MAX_MISSED_PINGS = 3;

const THUMBNAIL_URL = 'https://yt3.googleusercontent.com/ytc/AIdro_kYI3c-DdaW7GR6ahh748ikn0YRZnILdeOZqZrV_oOr0A=s900-c-k-c0x00ffffff-no-rj';

client.once('ready', async () => {
  console.log(`[LOG] Logged in as ${client.user.tag}`);
  try {
    await client.user.setActivity(`IP: ${MINECRAFT_SERVER_IP}`, { type: 'WATCHING' });
    console.log(`[LOG] Successfully set activity to: IP: ${MINECRAFT_SERVER_IP}`);
  } catch (error) {
    console.error(`[LOG] Failed to set activity: ${error.message}`);
  }

  await initializeStatusMessage();
  setInterval(checkMinecraftServerStatus, 5000);
});

async function initializeStatusMessage() {
  const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
  if (!channel) {
    return console.error(`[LOG] Status channel with ID ${STATUS_CHANNEL_ID} not found.`);
  }

  const messages = await channel.messages.fetch({ limit: 10 });
  const existingMessage = messages.find(msg => msg.author.id === client.user.id);

  if (existingMessage) {
    statusMessageId = existingMessage.id;
    console.log(`[LOG] Found existing status message with ID: ${statusMessageId}`);
  } else {
    const newMessage = await channel.send({ embeds: [createStatusEmbed()] });
    statusMessageId = newMessage.id;
    console.log(`[LOG] Created new status message with ID: ${statusMessageId}`);
  }
}

function createStatusEmbed() {
  const description = serverStatus === 'online' 
    ? `🟢 ︱**Server Status**: Online\n⏰ ︱**Uptime**: ${formatTime(Date.now() - uptimeStart)}`
    : `🔴 ︱**Server Status**: Offline\n⏰ ︱**Downtime**: ${formatTime(Date.now() - downtimeStart)}`;

  return new EmbedBuilder()
    .setColor(serverStatus === 'online' ? 'Green' : 'Red')
    .setTitle('Minecraft Server Status')
    .setDescription(description)
    .setThumbnail(THUMBNAIL_URL);
}

async function updateStatusMessage() {
  if (statusMessageId) {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    const statusMessage = await channel.messages.fetch(statusMessageId);
    await statusMessage.edit({ embeds: [createStatusEmbed()] });
    console.log(`[LOG] Updated status message with ID: ${statusMessageId}`);
  }
}

function formatTime(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));
  return `${hours}h ${minutes}m ${seconds}s`;
}

function checkMinecraftServerStatus() {
  const socket = new net.Socket();
  socket.setTimeout(5000);

  socket.connect(MINECRAFT_SERVER_PORT, MINECRAFT_SERVER_IP, () => {
    if (serverStatus === 'offline' && missedPings >= MAX_MISSED_PINGS) {
      // The server just came back online
      uptimeStart = Date.now();
      serverStatus = 'online';
      updateVoiceChannelName('[🟢] MC Server: Online');
      sendServerBackOnlineAlert();
    } else if (serverStatus === 'online') {
      // The server is still online
      updateVoiceChannelName('[🟢] MC Server: Online');
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
  console.log(`[LOG] Missed ping: ${missedPings}/${MAX_MISSED_PINGS}`);

  if (missedPings >= MAX_MISSED_PINGS) {
    if (serverStatus === 'online') {
      // The server just went offline
      downtimeStart = Date.now();
      serverStatus = 'offline';
      updateVoiceChannelName('[🔴] MC Server: Offline');
      sendServerOfflineAlert();
    } else if (serverStatus === 'offline') {
      // The server is still offline
      updateVoiceChannelName('[🔴] MC Server: Offline');
    }

    updateStatusMessage();
  }
}

async function sendServerOfflineAlert() {
  const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('⚠️ Minecraft Server Offline')
    .setDescription(`The server went offline at ${new Date(downtimeStart).toLocaleTimeString()}`)
    .setThumbnail(THUMBNAIL_URL);

  const message = await channel.send({ embeds: [embed] });
  announcementMessageId = message.id;
  console.log(`[LOG] Sent server offline alert with ID: ${announcementMessageId}`);
}

async function sendServerBackOnlineAlert() {
  if (announcementMessageId) {
    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
    const message = await channel.messages.fetch(announcementMessageId);

    const downtimeDuration = formatTime(Date.now() - downtimeStart);
    const uptimeDuration = formatTime(Date.now() - uptimeStart);
    const backOnlineTime = new Date(uptimeStart);
    const backOnlineTimeString = `${backOnlineTime.toLocaleTimeString()} on ${backOnlineTime.toLocaleDateString()}`;

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Minecraft Server Back Online')
      .setDescription(`The server was offline for ${downtimeDuration}. It went back online at ${backOnlineTimeString}.`)
      .setThumbnail(THUMBNAIL_URL);

    await message.edit({ embeds: [embed] });
    console.log(`[LOG] Updated server alert with ID: ${announcementMessageId}`);
    announcementMessageId = null; // Reset the announcement message ID
  }
}

async function updateVoiceChannelName(newName) {
  try {
    console.log(`[LOG] Attempting to fetch voice channel with ID: ${VOICE_CHANNEL_ID}`);
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
    if (channel) {
      console.log(`[LOG] Found voice channel: ${channel.name} (${channel.id})`);

      // Check if the bot has the necessary permissions
      const permissions = channel.permissionsFor(client.user);
      if (!permissions || !permissions.has('MANAGE_CHANNELS')) {
        console.error(`[LOG] Bot does not have permission to manage the channel: ${channel.name}`);
        return;
      }

      if (channel.name !== newName) {
        await channel.setName(newName);
        console.log(`[LOG] Voice channel name updated to: ${newName}`);
      } else {
        console.log(`[LOG] Voice channel name is already up to date: ${newName}`);
      }
    } else {
      console.error(`[LOG] Voice channel with ID ${VOICE_CHANNEL_ID} not found.`);
    }
  } catch (error) {
    console.error(`[LOG] Error updating voice channel name: ${error.message}`);
  }
}




client.login(TOKEN).catch(err => console.error(`[LOG] Failed to log in: ${err.message}`));
