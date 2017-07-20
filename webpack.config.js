var path = require('path');
const fs = require('fs');
const config = require('./config/config.js').config;

console.log('Webpack is packing config file: ', config);

config.port = process.env.PORT || 5555;

fs.writeFileSync(path.resolve(__dirname, 'config/config-packed.json'), JSON.stringify(config));

module.exports = {
  entry: './config/config-packed.json',
  output: {
    filename: 'config-packed.json',
    path: path.resolve(__dirname, 'build')
  }
};
