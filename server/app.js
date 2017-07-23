/* eslint-env node, browser */

const WebSocketServer = require('ws').Server;
const http = require('http');
const express = require('express');

const app = express();
const fs = require('fs');
const config = require('../config/config.js').config;

const port = process.env.PORT || 3000;

require.extensions['.html'] = function (module, filename) {
  // eslint-disable-next-line no-param-reassign
  module.exports = fs.readFileSync(filename, 'utf8');
};

const index = require('../build_custom/index.html');
// inject the heroku port inside config
config.port = port;
if (process.env.NODE_ENV === 'development') {
  config.env = 'development';
} else if (process.env.NODE_ENV === 'production') {
  config.env = 'production';
} else {
  console.log('No NODE_ENV variable supplied.');
  throw new Error('No NODE_ENV variable supplied.', JSON.stringify(process.env, null, 4));
}

app.use(express.static(`${__dirname}/../build`));
app.use('/', (req, res) => {
  console.log('Get on /');
  const modified = index.replace('__AM_DATA__', JSON.stringify(config));
  console.log('Initial html: ', index);
  console.log('Modified html: ', modified);
  res.set('Content-Type', 'text/html');
  res.send(new Buffer(modified));
  console.log('Sent modified index.html file.');
});

const server = http.createServer(app);
server.listen(port);

console.log('Http server listening on %d .', port);

const wss = new WebSocketServer({ server });
console.log('Websocket server created.');

wss.on('connection', (ws) => {
  const id = setInterval(() => {
    const message = { midiTest: true };
    console.log('Sending msg..');
    ws.send(JSON.stringify(message), () => {});
  }, 1000);

  console.log('Websocket connection opened.');
  ws.on('close', () => {
    console.log('Websocket connection closed.');
    clearInterval(id);
  });
});
