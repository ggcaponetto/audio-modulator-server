/* eslint-disable jsx-a11y/href-no-hash */
const Connector = require('./connector.js').Connector;

const run = (name, wss, connector, send, connectedCallback = null, closedCallback = null) => {
  // hold a reference to the ws connection and browserRequestId
  wss.on('connection', (ws) => {
    console.log(`${name}: connection opened.`);
    // Send a unique request id
    const id = connector.addPair({ ws, timestamp: Date.now() });
    const pairingMessage = {
      type: 'pairing',
      ts: {
        serverTS: Date.now()
      },
      payload: {
        targetId: id,
        obj: { }
      }
    };
    console.log(`${name}: sending a pairing request to the browser.`, pairingMessage);
    ws.send(JSON.stringify(pairingMessage), () => {});
    // Send heartbeat
    const heartBeatId = setInterval(() => {
      const message = {
        type: 'heartBeat',
        ts: {
          serverTS: Date.now()
        },
        payload: {
          targetId: id,
          obj: { }
        }
      };
      console.log(`${name}: sending a heart beat to the browser.`);
      ws.send(JSON.stringify(message), () => {});
    }, 1000);

    // Clear heartbeat interval
    ws.on('close', () => {
      console.log(`${name}: connection closed by browser.`);
      clearInterval(heartBeatId);
      connector.removePair(id);
      // connection closedCallback
      console.log('connector status after close: \n', connector);
      closedCallback(connector);
    });

    // send message to connections
    ws.on('message', (data) => {
      console.log('Got message (server): \n', data);
      const parsedData = JSON.parse(data);
      parsedData.ts.serverTS = Date.now();
      if (parsedData.type === 'pairing') {
        console.log('connector status before pairing: \n', connector);
        connector.markPaired(parsedData.payload.targetId);
        console.log('connector status after pairing: \n', connector);
      }
      if (parsedData.type === 'audiomodulator') {
        send(parsedData.payload.targetId, parsedData);
      }
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
  this.getConnector = () => this.connector;
  this.run = () => {
    run(
      this.name,
      this.wss,
      this.connector,
      this.send,
      (connector) => {
        // connected
        this.connector = connector;
      },
      (connector) => {
        // closed
        this.connector = connector;
      });
  };
  this.send = (id, obj, cb) => {
    console.log('connector status before sending message: \n', this.connector);
    this.connector.getPairs()
    .forEach((pair) => {
      if (pair.id === id && pair.isPaired) {
        console.log(`${name}: sending ${JSON.stringify(obj)} to pair ${id}`);
        pair.ws.send(JSON.stringify(obj), cb);
      }
    });
  };
}

module.exports = {
  AMWS
};
