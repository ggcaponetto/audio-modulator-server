var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var fs = require('fs');
var port = process.env.PORT || 3000;

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};
var index = require('../build_custom/index.html');
console.log('Loaded index.html file as string: ', index);

app.use(express.static(__dirname + "/../build"));
app.use('/', function(req, res, next){
  console.log('Get on /');
  const modified = index.replace("__AM_DATA__", `"${JSON.stringify({ pippo: "pluto" })}"`);
  console.log('Initial html: ', index);
  console.log('Modified html: ', modified);
  res.set('Content-Type', 'text/html');
  res.send(new Buffer(modified));
  console.log('Sent modified index.html file.');
});

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {
  var id = setInterval(function() {
    console.log("Sending msg..");
    ws.send(JSON.stringify(new Date()), function() {  })
  }, 1000);

  console.log("websocket connection open")
  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
})
