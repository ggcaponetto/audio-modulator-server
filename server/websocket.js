
const run = (name, wss) => {
  wss.on('connection', (ws) => {
    const id = setInterval(() => {
      const message = { type: 'heartBeat', timestampServerEmit: Date.now() };
      console.log(`${name}: sending a heart beat`);
      ws.send(JSON.stringify(message), () => {});
    }, 1000);
    console.log(`${name}: connection opened.`);
    ws.on('close', () => {
      console.log(`${name}: connection closed.`);
      clearInterval(id);
    });
  });
};

function AMWS(name, wss){
    this.name = name;
    this.wss = wss; // WebSocketServer
    this.run = () => {
      run(this.name, this.wss);
    };
}

module.exports = {
  AMWS
}
