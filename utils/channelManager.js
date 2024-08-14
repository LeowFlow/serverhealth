const { log } = require('./logger');
const config = require('../config.json');

async function updateVoiceChannelName(client, newName) {
    try {
      log(`[LOG] Attempting to fetch voice channel with ID: ${config.voiceChannelId}`);
      const channel = await client.channels.fetch(config.voiceChannelId);
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
        log(`[LOG] Voice channel with ID ${config.voiceChannelId} not found.`);
      }
    } catch (error) {
      log(`[LOG] Error updating voice channel name: ${error.message}`);
    }
  }
  
  module.exports = { updateVoiceChannelName };
  
