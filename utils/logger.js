const LOGS = [];

function log(message) {
  console.log(message);
  LOGS.push(message);
  if (LOGS.length > 100) LOGS.shift();
}

module.exports = { log, LOGS };
