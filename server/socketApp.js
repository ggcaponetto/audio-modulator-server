const PORT = 3001;
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(PORT);

io.on('connection', function (socket) {
  console.log('Socket connection open on port: ' + PORT);
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  setInterval(() => {
    socket.emit('news', { hello: 'world' });
  }, 2000);
});
