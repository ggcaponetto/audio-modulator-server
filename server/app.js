var WebSocketServer = require("wss").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/../build/"))

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
