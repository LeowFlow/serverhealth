const { saveUptime } = require('../utils/uptimeManager');
const { log } = require('../utils/logger');
const config = require('../config.json');

module.exports = {
  execute: async (message, args, context) => {
    if (message.member.roles.cache.has(config.adminRoleId)) {
      log(`[COMMAND] ${message.author.tag} reset the bot's counters.`);
      context.uptimeStart = Date.now();
      context.downtimeStart = null;
      context.missedPings = 0;
      saveUptime(context.uptimeStart);
      message.reply('Uptime and downtime counters have been reset.');
    } else {
      message.reply('You do not have permission to use this command.');
    }
  },
};
