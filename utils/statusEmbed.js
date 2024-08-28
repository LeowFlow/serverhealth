const { EmbedBuilder, Colors } = require('discord.js');

function createStatusEmbed(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players) {
  const description = serverDescription || "No description available.";
  const version = serverVersion || "Unknown";
  const maxPlayersValue = maxPlayers || "Unknown";
  const playersList = Array.isArray(players) && players.length > 0 ? players.join(', ') : "No players online";

  const embed = {
    color: serverStatus === 'online' ? 0x00ff00 : 0xff0000,
    title: `**Old School Minecraft Status** - ${serverStatus.toUpperCase()}`,
    description: description,
    fields: [
      { name: '🛠️ **Server Version**', value: version, inline: true },
      { name: '👥 **Players Online**', value: `${playerCount}/${maxPlayersValue}`, inline: true },
      { name: '⏳ **Uptime**', value: formatUptime(uptimeStart), inline: true },
      { name: '📋 **Player List**', value: playersList, inline: false },
    ],
    thumbnail: {
      url: 'http://wiki.os-mc.net/images/thumb/e/ee/Old_School_Minecraft_Logo.png/380px-Old_School_Minecraft_Logo.png',  // Replace with your desired image URL
    },
    timestamp: new Date(),
    footer: {
      text: `Last updated`
    }
  };
  return embed;
}

function formatUptime(uptimeStart) {
  const uptime = Date.now() - uptimeStart;
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}


module.exports = { createStatusEmbed };

