/* eslint-env node, browser */

const WebSocketServer = require('ws').Server;
const http = require('http');
const express = require('express');

const app = express();
const fs = require('fs');
const config = require('../config/config.js').config;

const NODE_ENV = process.env.NODE_ENV;
const port = process.env.PORT || config[NODE_ENV].port;

require.extensions['.html'] = function (module, filename) {
  // eslint-disable-next-line no-param-reassign
  module.exports = fs.readFileSync(filename, 'utf8');
};

const index = require('../build/index.html');
// inject the heroku port inside config
console.log(`Running server/app.js with NODE_ENV=${NODE_ENV}.`);
config.development.port = port;
config.production.port = port;
config.development.env = NODE_ENV;
config.production.env = NODE_ENV;

app.use(express.static(`${__dirname}/../build-custom-no-index`));
app.use('/', (req, res) => {
  const modified = index.replace('__AM_DATA__', JSON.stringify(config[`${NODE_ENV}`], null, 4));
  res.set('Content-Type', 'text/html');
  res.send(new Buffer(modified));
  console.log('Sent index.html (from build folder) with config injection.', JSON.stringify(config[NODE_ENV], null, 4));
});

const server = http.createServer(app);
server.listen(port);

console.log('Http server listening on port %d .', port);

const wss = new WebSocketServer({ server });
console.log('Websocket server created.');

wss.on('connection', (ws) => {
  const id = setInterval(() => {
    const message = { type: "heartBeat", timestampServerEmit: Date.now() };
    console.log('Sending heartBeat.');
    ws.send(JSON.stringify(message), () => {});
  }, 1000);
  console.log('Websocket connection opened.');
  ws.on('close', () => {
    console.log('Websocket connection closed.');
    clearInterval(id);
  });
});
