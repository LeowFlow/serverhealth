const { createStatusEmbed } = require('../utils/statusEmbed');

module.exports = {
  execute: async (message, args, context) => {
    const { serverStatus, uptimeStart, downtimeStart } = context;
    const statusEmbed = createStatusEmbed(serverStatus, uptimeStart, downtimeStart);
    await message.channel.send({ embeds: [statusEmbed] });
  },
};
