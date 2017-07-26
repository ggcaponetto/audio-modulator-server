const pjson = require('../package.json');

const config = {
  production: {
    port: 3000,
    name: 'AudioModulator',
    version: pjson.version,
    https_host: 'https://murmuring-dusk-99045.herokuapp.com',
    http_host: 'http://murmuring-dusk-99045.herokuapp.com',
    wss_host: 'wss://murmuring-dusk-99045.herokuapp.com',
    ws_host: 'ws://murmuring-dusk-99045.herokuapp.com',
    isConsoleLogEnabled: false
  },
  development: {
    port: 5000,
    name: 'AudioModulator',
    version: pjson.version,
    https_host: 'https://localhost',
    http_host: 'http://localhost',
    wss_host: 'wss://localhost',
    ws_host: 'ws://localhost',
    isConsoleLogEnabled: true
  }
};

module.exports = {
  config
};
