var path = require('path');
const fs = require('fs');
const config = require('../config/config.js').config;

console.log('App is preparing config file: ', config);

config.port = process.env.PORT || 5555;

fs.writeFileSync(path.resolve(__dirname, '../build/config-production.json'), JSON.stringify(config));
