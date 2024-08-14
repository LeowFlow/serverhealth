const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const net = require('net');
const fs = require('fs');
const path = require('path');

const TOKEN = 'MTI3MjkzNTkzNjk5MjIxNTA0MA.GV4kW6.AsimgsKws6TLVtD1xl1Ua5WVFOlU09ojBJfFOo'; // oh noes please dont steal my token!!!!
const GUILD_ID = '549321864443592724'; // OSM Guild ID 
const VOICE_CHANNEL_ID = '1273232886543290391'; 
const ANNOUNCEMENT_CHANNEL_ID = '638836089607684141'; //#general channel 
const STATUS_CHANNEL_ID = '867478353094639646'; //#server-info channel
const ADMIN_ROLE_ID = '618177168786325516'; // staff role ID

const MINECRAFT_SERVER_IP = 'os-mc.net';
const MINECRAFT_SERVER_PORT = 25565;

const UPTIME_FILE = path.join(__dirname, 'uptime.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let serverStatus = 'online';
let downtimeStart = null;
let uptimeStart = loadUptime(); // Load the last uptime from the JSON file
let statusMessageId = null;
let missedPings = 0;
let announcementMessageId = null; // Track the ID of the announcement message
const MAX_MISSED_PINGS = 100;
const LOGS = []; // To keep track of logs

const THUMBNAIL_URL = 'https://yt3.googleusercontent.com/ytc/AIdro_kYI3c-DdaW7GR6ahh748ikn0YRZnILdeOZqZrV_oOr0A=s900-c-k-c0x00ffffff-no-rj';

client.once('ready', async () => {
  log(`[LOG] Logged in as ${client.user.tag}`);
  try {
    await client.user.setActivity(`IP: ${MINECRAFT_SERVER_IP}`, { type: 'WATCHING' });
    log(`[LOG] Successfully set activity to: IP: ${MINECRAFT_SERVER_IP}`);
  } catch (error) {
    log(`[LOG] Failed to set activity: ${error.message}`);
  }

  await initializeStatusMessage();
  setInterval(checkMinecraftServerStatus, 5000); // Check server status every 5 seconds
  setInterval(updateStatusMessage, 30000); // Update the status message every 30 seconds
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!status') {
    log(`[COMMAND] ${message.author.tag} requested server status.`);
    const statusEmbed = createStatusEmbed();  // Create the status embed
    await message.channel.send({ embeds: [statusEmbed] });  // Send the embed to the channel where the command was run
  }

  if (command === '!reset') {
    if (message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      log(`[COMMAND] ${message.author.tag} reset the bot's counters.`);
      uptimeStart = Date.now();
      downtimeStart = null;
      missedPings = 0;
      saveUptime(uptimeStart); // Save the new uptime start time
      message.reply('Uptime and downtime counters have been reset.');
    } else {
      message.reply('You do not have permission to use this command.');
    }
  }

  if (command === '!logs') {
    log(`[COMMAND] ${message.author.tag} requested logs.`);
    const recentLogs = LOGS.slice(-10).join('\n');
    message.reply(`Recent logs:\n\`\`\`${recentLogs}\`\`\``);
  }

  if (command === '!uptime') {
    const uptimeDuration = formatTime(Date.now() - uptimeStart);
    message.reply(`The server has been online for ${uptimeDuration}.`);
  }

  if (command === '!downtime') {
    if (downtimeStart) {
      const downtimeDuration = formatTime(Date.now() - downtimeStart);
      message.reply(`The server has been offline for ${downtimeDuration}.`);
    } else {
      message.reply('The server is currently online.');
    }
  }
});

async function initializeStatusMessage() {
  const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
  if (!channel) {
    return log(`[LOG] Status channel with ID ${STATUS_CHANNEL_ID} not found.`);
  }

  const messages = await channel.messages.fetch({ limit: 10 });
  const existingMessage = messages.find(msg => msg.author.id === client.user.id);

  if (existingMessage) {
    statusMessageId = existingMessage.id;
    log(`[LOG] Found existing status message with ID: ${statusMessageId}`);
  } else {
    const newMessage = await channel.send({ embeds: [createStatusEmbed()] });
    statusMessageId = newMessage.id;
    log(`[LOG] Created new status message with ID: ${statusMessageId}`);
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
    log(`[LOG] Updated status message with ID: ${statusMessageId}`);
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
      saveUptime(uptimeStart); // Save the new uptime start time
      serverStatus = 'online';
      updateVoiceChannelName('[🟢] MC Server: Online');
      sendServerBackOnlineAlert();
    } else if (serverStatus === 'online') {
      // The server is still online
      updateVoiceChannelName('[🟢] MC Server: Online');
    }

    missedPings = 0;
    socket.destroy();
  });

  socket.on('error', handleMissedPing);
  socket.on('timeout', handleMissedPing);
}

function handleMissedPing() {
  missedPings++;
  log(`[LOG] Missed ping: ${missedPings}/${MAX_MISSED_PINGS}`);

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
  }
}

async function sendServerOfflineAlert() {
  const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('⚠️ Minecraft Server Offline')
    .setDescription(`The server went offline at ${new Date(downtimeStart).toLocaleTimeString()}`)
    .setThumbnail(THUMBNAIL_URL);

  const message = await channel.send({ content: `<@&${ADMIN_ROLE_ID}>`, embeds: [embed] });
  announcementMessageId = message.id;
  log(`[LOG] Sent server offline alert with ID: ${announcementMessageId}`);
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
    log(`[LOG] Updated server alert with ID: ${announcementMessageId}`);
    announcementMessageId = null; // Reset the announcement message ID
  }
}

async function updateVoiceChannelName(newName) {
  try {
    log(`[LOG] Attempting to fetch voice channel with ID: ${VOICE_CHANNEL_ID}`);
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
    if (channel) {
      log(`[LOG] Found voice channel: ${channel.name} (${channel.id})`);

      // Check if the bot has the necessary permissions
      const permissions = channel.permissionsFor(client.user);
      if (!permissions || !permissions.has('MANAGE_CHANNELS')) {
        log(`[LOG] Bot does not have permission to manage the channel: ${channel.name}`);
        return;
      }

      if (channel.name !== newName) {
        await channel.setName(newName);
        log(`[LOG] Voice channel name updated to: ${newName}`);
      } else {
        log(`[LOG] Voice channel name is already up to date: ${newName}`);
      }
    } else {
      log(`[LOG] Voice channel with ID ${VOICE_CHANNEL_ID} not found.`);
    }
  } catch (error) {
    log(`[LOG] Error updating voice channel name: ${error.message}`);
  }
}

function loadUptime() {
  try {
    if (fs.existsSync(UPTIME_FILE)) {
      const data = fs.readFileSync(UPTIME_FILE);
      const json = JSON.parse(data);
      log('[LOG] Uptime data loaded successfully.');
      return json.uptimeStart || Date.now();
    }
  } catch (error) {
    log(`[LOG] Failed to load uptime data: ${error.message}`);
  }
  return Date.now(); // Default to now if there's no data or an error occurs
}

function saveUptime(uptimeStart) {
  try {
    const data = JSON.stringify({ uptimeStart });
    fs.writeFileSync(UPTIME_FILE, data);
    log('[LOG] Uptime data saved successfully.');
  } catch (error) {
    log(`[LOG] Failed to save uptime data: ${error.message}`);
  }
}

function log(message) {
  console.log(message);
  LOGS.push(message);
  if (LOGS.length > 100) LOGS.shift(); // Keeps only the last 100 logs
}

client.login(TOKEN).catch(err => log(`[LOG] Failed to log in: ${err.message}`));