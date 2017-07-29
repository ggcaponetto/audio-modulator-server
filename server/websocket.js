const Connector = require('./connector.js').Connector;

const run = (name, wss, connector) => {
  wss.on('connection', (ws) => {
    console.log(`${name}: connection opened.`);
    const browserRequestId = connector.addBrowserRequest();
    console.log('connector status: \n' + JSON.stringify(connector));
    const pairingMessage = { type: 'browserRequestId', payload: { browserRequestId } };
    console.log(`${name}: sending a browser request id.`);
    ws.send(JSON.stringify(pairingMessage), () => {});
    // Send heartbeat
    const id = setInterval(() => {
      const message = { type: 'heartBeat', payload: { timestampServerEmit: Date.now() } };
      console.log(`${name}: sending a heart beat`);
      ws.send(JSON.stringify(message), () => {});
    }, 1000);
    // Clear heartbeat interval
    ws.on('close', () => {
      console.log(`${name}: connection closed.`);
      clearInterval(id);
      connector.removeBrowserRequest(browserRequestId);
      console.log('connector status: \n' + JSON.stringify(connector));
    });
  });
};

function AMWS(name, wss){
    this.name = name;
    this.wss = wss; // WebSocketServer
    this.run = () => {
      const connector = new Connector(this.name +  'connector');
      run(this.name, this.wss, connector);
    };
}

module.exports = {
  AMWS
}
