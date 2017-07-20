var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var fs = require('fs');
var config = require("../config/config.js").config;
var port = process.env.PORT || 3000;

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var index = require('../build_custom/index.html');
console.log('Loaded index.html file as string: ', index);

// inject the heroku port inside config
config.port = port;
if(process.env.NODE_ENV === 'development'){
  config.env = 'development';
} else if(process.env.NODE_ENV === 'production'){
  config.env = 'production';
}

app.use(express.static(__dirname + "/../build"));
app.use('/', function(req, res, next){
  console.log('Get on /');
  const modified = index.replace("__AM_DATA__", JSON.stringify(config));
  console.log('Initial html: ', index);
  console.log('Modified html: ', modified);
  res.set('Content-Type', 'text/html');
  res.send(new Buffer(modified));
  console.log('Sent modified index.html file.');
});

var server = http.createServer(app)
server.listen(port)

console.log("Http server listening on %d .", port)

var wss = new WebSocketServer({server: server})
console.log("Websocket server created.")

wss.on("connection", function(ws) {
  var id = setInterval(function() {
    console.log("Sending msg..");
    ws.send(JSON.stringify(new Date()), function() {  })
  }, 1000);

  console.log("Websocket connection opened.")
  ws.on("close", function() {
    console.log("Websocket connection closed.")
    clearInterval(id)
  })
})
