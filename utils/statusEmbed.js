const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { formatTime } = require('./timeFormatter.js');

function createStatusEmbed(serverStatus, uptimeStart, downtimeStart) {
  const description = serverStatus === 'online' 
    ? `🟢 ︱**Server Status**: Online\n⏰ ︱**Uptime**: ${formatTime(Date.now() - uptimeStart)}`
    : `🔴 ︱**Server Status**: Offline\n⏰ ︱**Downtime**: ${formatTime(Date.now() - downtimeStart)}`;

  return new EmbedBuilder()
    .setColor(serverStatus === 'online' ? 'Green' : 'Red')
    .setTitle('Minecraft Server Status')
    .setDescription(description)
    .setThumbnail(config.thumbnailUrl);
}

module.exports = { createStatusEmbed };

