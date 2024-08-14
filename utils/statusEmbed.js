const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { formatTime } = require('./timeFormatter.js');

function createStatusEmbed() {
  const greenOrb = '<:greenOrb:123456789012345678>';
  const redOrb = '<:redOrb:876543210987654321>';

  const description = serverStatus === 'online' 
    ? `${greenOrb} ︱**Server Status**: Online\n⏰ ︱**Uptime**: ${formatTime(Date.now() - uptimeStart)}`
    : `${redOrb} ︱**Server Status**: Offline\n⏰ ︱**Downtime**: ${formatTime(Date.now() - downtimeStart)}`;

  return new EmbedBuilder()
    .setColor(serverStatus === 'online' ? 'Green' : 'Red')
    .setTitle('Minecraft Server Status')
    .setDescription(description)
    .setThumbnail(config.thumbnailUrl);
}

module.exports = { createStatusEmbed };
