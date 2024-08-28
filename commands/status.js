const { createStatusEmbed } = require('../utils/statusEmbed');

module.exports = {
  execute: async (message, args, context) => {
    const { serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players } = context;
    const statusEmbed = createStatusEmbed(serverStatus, uptimeStart, downtimeStart, playerCount, maxPlayers, serverDescription, serverVersion, players);
    await message.channel.send({ embeds: [statusEmbed] });
  },
};
