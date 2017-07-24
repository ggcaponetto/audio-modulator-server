const pjson = require('../package.json');

const config = {
  production: {
    name: 'AudioModulator',
    version: pjson.version,
    https_host: 'https://murmuring-dusk-99045.herokuapp.com',
    http_host: 'http://murmuring-dusk-99045.herokuapp.com',
    wss_host: 'wss://murmuring-dusk-99045.herokuapp.com',
    ws_host: 'ws://murmuring-dusk-99045.herokuapp.com'
  },
  development: {
    name: 'AudioModulator',
    version: pjson.version,
    https_host: 'https://localhost',
    http_host: 'http://localhost',
    wss_host: 'wss://localhost',
    ws_host: 'ws://localhost'
  }
};

module.exports = {
  config
};
