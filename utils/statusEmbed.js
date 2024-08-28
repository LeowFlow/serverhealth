const { EmbedBuilder, Colors } = require('discord.js');

function createStatusEmbed(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverVersion, playersData, isWhitelistEnabled) {
  const version = serverVersion || "Unknown";
  const maxPlayersValue = maxPlayers || "Unknown";
  const playersList = Array.isArray(playersData) && playersData.length > 0
    ? playersData.map(player => player.username).join(', ')
    : "No players online";

  let titleText = serverStatus === 'online' 
    ? "Old School Minecraft is currently online! ✅"
    : "Old School Minecraft is currently offline!! 😭";
  
  if (isWhitelistEnabled) {
    titleText = "Old School Minecraft is currently online, but in whitelist mode! ⚠️";
  }

  const embed = new EmbedBuilder()
    .setColor(serverStatus === 'online' ? Colors.Green : Colors.Red)
    .setTitle(titleText)
    .addFields(
      { name: '🛠️ **Server Version**', value: version, inline: true },
      { name: '👥 **Players Online**', value: `${playerCount}/${maxPlayersValue}`, inline: true },
      { name: '⏳ **Uptime**', value: formatUptime(uptimeStart), inline: true },
      { name: '📋 **Player List**', value: playersList, inline: false }
    )
    .setThumbnail('http://wiki.os-mc.net/images/e/ee/Old_School_Minecraft_Logo.png?20240409214716')  
    .setTimestamp()
    .setFooter({ text: 'Last updated' });

  // Add the channel mention for applying to the whitelist
  const targetChannelId = '1054587532869894174'; 
  if (isWhitelistEnabled) {
    embed.addFields({ 
      name: '**Apply Now!**', 
      value: `Click here to apply: <#${targetChannelId}>`
    });
  }

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
