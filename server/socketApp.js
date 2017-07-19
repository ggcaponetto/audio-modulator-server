var app = require('express')();
var server = require('https').Server(app);
var io = require('socket.io')(server);

const WS_PORT = 8080;
server.listen(WS_PORT);
console.log('socketApp listening on port: ' + WS_PORT);

io.on('connection', function (socket) {
  console.log('Socket.io connection open on port: ' + WS_PORT);
  console.log('Emitting new message. (initial)');
  socket.emit('news', { hello: 'world' });
  setInterval(() => {
    console.log('Emitting new message. (timer based)');
    socket.emit('news', { hello: 'world' });
  }, 2000);
});
