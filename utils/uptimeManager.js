const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { log } = require('./logger');

function loadUptime() {
  try {
    if (fs.existsSync(config.uptimeFile)) {
      const data = fs.readFileSync(config.uptimeFile, 'utf8');
      const json = JSON.parse(data);
      log('[LOG] Uptime data loaded successfully.');
      return json.uptimeStart || Date.now();
    } else {
      log('[LOG] Uptime file does not exist, creating a new one.');
      saveUptime(Date.now());
      return Date.now();
    }
  } catch (error) {
    log(`[LOG] Failed to load uptime data: ${error.message}`);
    return Date.now();
  }
}

function saveUptime(uptimeStart) {
  try {
    const data = JSON.stringify({ uptimeStart });
    fs.writeFileSync(config.uptimeFile, data);
    log('[LOG] Uptime data saved successfully.');
  } catch (error) {
    log(`[LOG] Failed to save uptime data: ${error.message}`);
  }
}

module.exports = { loadUptime, saveUptime };
