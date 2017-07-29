/* eslint-disable jsx-a11y/href-no-hash */
const Connector = require('./connector.js').Connector;

const run = (name, wss, connector, connectedCallback = null, closedCallback = null) => {
  // hold a reference to the ws connection and browserRequestId
  wss.on('connection', (ws) => {
    console.log(`${name}: connection opened.`);
    // Send a unique request id
    const browserRequestId = connector.addBrowserRequest();
    const pairingMessage = { type: 'browserRequestId', payload: { browserRequestId } };
    console.log(`${name}: sending a browser request id.`, pairingMessage);
    ws.send(JSON.stringify(pairingMessage), () => {});
    connector.addPair({ browserRequestId, ws, timestamp: Date.now() });
    // Send heartbeat
    const id = setInterval(() => {
      const message = { type: 'heartBeat', payload: { timestampServerEmit: Date.now() } };
      console.log(`${name}: sending a heart beat`);
      ws.send(JSON.stringify(message), () => {});
    }, 1000);

    // forward message from app to browser
    ws.on('message', (data) => {
      console.log('Got message: ', data);
      const parsedData = JSON.parse(data);
      console.log('Parsed message: ', parsedData);
      if (parsedData.type === 'audiomodulator') {
        console.log(`${name}: forwarding app message `, parsedData);
        ws.send(JSON.stringify(parsedData), () => {});
      }
    });

    // Clear heartbeat interval
    ws.on('close', () => {
      console.log(`${name}: connection closed.`);
      clearInterval(id);
      connector.removeBrowserRequest(browserRequestId);
      connector.removePair(browserRequestId);

      // connection closedCallback
      console.log('connector status after close: \n', connector);
      closedCallback(connector);
    });

    // connection connectedCallback
    console.log('connector status after connection: \n', connector);
    connectedCallback(connector);
  });
};

function AMWS(name, wss) {
  this.name = name;
  this.wss = wss; // WebSocketServer
  this.connector = new Connector(`${this.name}connector`);
  this.run = () => {
    run(
      this.name,
      this.wss,
      this.connector,
      (connector) => {
        // connected
        this.connector = connector;
        this.connector.getPairs()
        .forEach((pair) => {
          pair.ws.on('message', (data) => {
            console.log('Got message: ', data);
            const parsedData = JSON.parse(data);
            console.log('Parsed message: ', parsedData);
            if (parsedData.type === 'audiomodulator') {
              console.log(`browserRequestId -> ${pair.browserRequestId} -> forwarding app message `, parsedData);
              pair.ws.send(JSON.stringify(parsedData), () => {});
            }
          });
        });
      },
      (connector) => {
        // closed
        this.connector = connector;
      });
  };
  this.send = (browserRequestId, obj, cb) => {
    console.log('connector status before sending message: \n', this.connector);
    this.connector.getPairs()
    .forEach((pair) => {
      if (pair.browserRequestId === browserRequestId) {
        console.log(`${name}: sending ${JSON.stringify(obj)} to pair ${browserRequestId}`);
        pair.ws.send(JSON.stringify(obj), cb);
      }
    });
  };
}

module.exports = {
  AMWS
};
