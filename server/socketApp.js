var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const WS_PORT = 8080;
server.listen(WS_PORT);

io.on('connection', function (socket) {
  console.log('Socket connection open on port: ' + WS_PORT);
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  setInterval(() => {
    socket.emit('news', { hello: 'world' });
  }, 2000);
});
