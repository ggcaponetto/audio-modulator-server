/* eslint-env browser */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Logger from '../util/logger';

let log = null;
const bypassMIDIMoutput = 'Bypass';
const grey = '#b5b5b5';
const selectedOutputStyle = { color: grey };

function getFormattedOutput(output) {
  // return `ID: ${output.id
  // }, Manufacturer: ${output.manufacturer}, Name: ${output.name}`;
  if (!output) {
    return bypassMIDIMoutput;
  }
  if (output.manufacturer) {
    return `${output.manufacturer}, ${output.name}`;
  }
  return `${output.name}`;
}

function sendMiddleC(context) {
  const noteOnMessage = [0x90, 0x35, 0x7f]; // note on, middle C, full velocity
  const output = context.state.output;
  // log(`Sending ${JSON.stringify(noteOnMessage)} to: `, output);
  try {
    output.send(noteOnMessage); // omitting the timestamp means send immediately.
    // Inlined array creation- note off, middle C,
    // release velocity = 64, timestamp = now + 1000ms.
    output.send([0x80, 60, 0x40], window.performance.now() + 200.0);
  } catch (e) {
    console.log('Not a valid MIDI output.');
  }
}

function onMIDIMessage(event) {
  /* eslint-disable no-unused-vars */
  let str = `MIDI message received at timestamp ${event.timestamp}[${event.data.length} bytes]: `;
  for (let i = 0; i < event.data.length; i++) {
    str += `0x${event.data[i].toString(16)} `;
  }
  // log(str);
  /* eslint-enable no-unused-vars */
}

function injectLoggerToMidiInputs(midiAccess) {
  log('Start loggin MIDI input.');
  midiAccess.inputs.forEach((entry) => {
    // eslint-disable-next-line no-param-reassign
    entry.onmidimessage = onMIDIMessage;
  });
  return midiAccess;
}

class AudioModulator extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      midi: null,
      isMidiReady: false,
      output: null,
      messages: [],
      averageLatencies: { serverBrowser: 0, clientServer: 0, clientBrowser: 0 },
      id: null
    };
    this.getOutputs = this.getOutputs.bind(this);
    this.calculateLatency = this.calculateLatency.bind(this);

    log = new Logger('AudioModulator', this.props.config).log;
  }

  componentDidMount() {
    const self = this;
    const onMIDISuccess = (midiAccess) => {
      self.setState({
        isMidiReady: true,
        midi: injectLoggerToMidiInputs(midiAccess)
      }, () => {
        // midi is ready
        this.props.onMIDIStatusChange({ isRedy: true });
        log('MIDI is ready.');
        const config = this.props.config;
        try {
          let websocketHost = null;
          if (config.env === 'production') {
            websocketHost = `${config.wss_host}`;
          } else if (config.env === 'development') {
            websocketHost = `${config.ws_host}:${config.port}`;
          } else {
            throw new Error('Unsupported "config.env", please check the NODE_ENV supplied to the start script.', config.env);
          }
          log(`Opening socket on: ${websocketHost}`);
          const ws = new WebSocket(websocketHost);
          ws.onmessage = (event) => {
            log('Got websocket data (browser): ', event.data);
            const data = JSON.parse(event.data);
            data.ts.browserTS = Date.now();
            log('Got websocket data (browser) -> (injected browserTS): ', data);
            this.calculateLatency(data);
            self.props.onMessage(data);

            if (data.type === 'pairing') {
              log('Got pairing message: ', data);
              self.setState({
                id: data.payload.targetId
              });
            }

            if (data.type === 'audiomodulator') {
              log('Got audiomodulator: ', data);
              sendMiddleC(self);
            }
          };
        } catch (e) {
          log('Could not create the websocket using config: ', config);
        }
      });
    };

    const onMIDIFailure = (msg) => {
      log(`Failed to get MIDI access - ${msg}`);
      this.props.onMIDIStatusChange({ isRedy: false });
    };

    navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
  }

  getOutputs() {
    const self = this;
    const getOutputDevices = (midiAccess) => {
      const outputs = [
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus
        <div
          role="button"
          key={'none'}
          className="midiOutputSelection row"
          onClick={() => {
            self.setState({
              output: null
            }, () => {
              log('Changed midi output to: ', bypassMIDIMoutput);
              self.props.onMIDIOutputChange(self.state.output);
            });
          }}
        >
          <div className="midiOutput">
            <span style={this.state.output === null ? selectedOutputStyle : null}>
              {bypassMIDIMoutput}
            </span>
          </div>
        </div>
      ];
      midiAccess.outputs.forEach((entry) => {
        const output = entry;
        outputs.push(
          // eslint-disable-next-line jsx-a11y/interactive-supports-focus
          <div
            role="button"
            key={`${output.id}`}
            className="midiOutputSelection row"
            onClick={() => {
              self.setState({
                output
              }, () => {
                log('Changed midi output to: ', getFormattedOutput(output));
                self.props.onMIDIOutputChange(self.state.output);
              });
            }}
          >
            <div className="midiOutput">
              <span
                style={
                  this.state.output && (this.state.output.id === output.id) ?
                    selectedOutputStyle :
                    null
                }
              >
                {getFormattedOutput(output)}
              </span>
            </div>
          </div>
        );
      });
      return outputs;
    };
    const outputDevices = getOutputDevices(self.state.midi);
    return (
      <div>
        {outputDevices}
      </div>
    );
  }

  getFormattedLatencies() {
    const latencies = this.state.averageLatencies;
    return `Server to browser latency is ${latencies.serverBrowser} ms. Client to server latency is ${latencies.clientServer} ms. Client to browswer latency is ${latencies.clientBrowser} ms.`;
  }

  calculateLatency(data) {
    log('AudioModulator calculateLatency:', data);
    const BUFFER_SIZE = 5;
    const messages = [].concat(this.state.messages);
    if (messages.length >= BUFFER_SIZE) {
      messages.shift();
      messages.push(data);
    } else {
      messages.push(data);
    }
    this.setState({
      messages
    }, () => {
      let totalDelayServerBrowser = 0;
      let totalDelayClientServer = 0;
      let totalDelayClientBrowser = 0;

      let serverBrowserCount = 0;
      let clientServerCount = 0;
      let clientBrowserCount = 0;

      messages.forEach((msg) => {
        serverBrowserCount += 1;
        const diffServerBrowser = msg.ts.browserTS - msg.ts.serverTS;
        totalDelayServerBrowser += diffServerBrowser;

        if (msg.ts.clientTS) {
          clientServerCount += 1;
          clientBrowserCount += 1;
          const diffClientServer = msg.ts.serverTS - msg.ts.clientTS;
          const diffClientBrowser = msg.ts.browserTS - msg.ts.clientTS;
          totalDelayClientServer += diffClientServer;
          totalDelayClientBrowser += diffClientBrowser;
        }
      });
      const round = num => Math.round(num * 100) / 100;
      const averageLatencies = {
        serverBrowser: round(totalDelayServerBrowser / serverBrowserCount),
        // eslint-disable-next-line max-len
        clientServer: round(clientServerCount === 0 ? 0 : totalDelayClientServer / clientServerCount),
        // eslint-disable-next-line max-len
        clientBrowser: round(clientBrowserCount === 0 ? 0 : totalDelayClientBrowser / clientBrowserCount)
      };
      this.props.onAverageLatencyUpdate(averageLatencies);
      this.setState({
        averageLatencies
      });
    });
  }

  render() {
    /* eslint-disable max-len */
    return (
      <div id="audioModulator row">
        <p>
          Your browser&apos;s MIDI is {this.state.isMidiReady ? 'ready' : 'not ready'}.
          The selected MIDI output is <span style={selectedOutputStyle}>{getFormattedOutput(this.state.output)}</span>.
          Click on the labels to switch MIDI output. {this.getFormattedLatencies()}
          Your device pairing number is: {this.state.id !== null ? this.state.id : 'Loading...'}
        </p>
        {this.state.isMidiReady ? this.getOutputs() : null}
      </div>
    );
    /* eslint-enable max-len */
  }
}

AudioModulator.propTypes = {
  config: PropTypes.object.isRequired,
  onMIDIOutputChange: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onMIDIStatusChange: PropTypes.func.isRequired,
  onAverageLatencyUpdate: PropTypes.func.isRequired,
  isHeartBeatEanbled: PropTypes.bool.isRequired
};

export default AudioModulator;
