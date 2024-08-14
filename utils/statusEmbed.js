const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { formatTime } = require('./timeFormatter.js');

function createStatusEmbed(serverStatus, uptimeStart, downtimeStart) {
  const greenOrb = '<:greenOrb:1222915426414231644>';
  const redOrb = '<:redOrb:1222915427760341114>';

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
