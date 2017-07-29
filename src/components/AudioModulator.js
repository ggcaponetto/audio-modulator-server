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
  output.send(noteOnMessage); // omitting the timestamp means send immediately.
  // Inlined array creation- note off, middle C,
  // release velocity = 64, timestamp = now + 1000ms.
  output.send([0x80, 60, 0x40], window.performance.now() + 200.0);
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
      heartBeats: [],
      averageLatency: 0,
      browserRequestId: null
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
            log('Got websocket data: ', event.data);
            const data = JSON.parse(event.data);
            self.props.onMessage(data);

            if (data.type === 'heartBeat') {
              // log('Got heartBeat: ', data);
              data.timestampClientReceive = Date.now();
              self.calculateLatency(data);
            }

            if (data.type === 'browserRequestId') {
              log('Got browserRequestId: ', data);
              self.setState({
                browserRequestId: data.payload.browserRequestId
              });
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
                log('Changed midi output to: ', bypassMIDIMoutput);
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

  calculateLatency(data) {
    // log('AudioModulator calculateLatency:', data);
    const BUFFER_SIZE = 5;
    const heartBeats = [].concat(this.state.heartBeats);
    if (heartBeats.length >= BUFFER_SIZE) {
      heartBeats.shift();
      heartBeats.push(data);
    } else {
      heartBeats.push(data);
    }
    this.setState({
      heartBeats
    }, () => {
      let totalDelay = 0;
      heartBeats.forEach((hb) => {
        const diff = hb.timestampClientReceive - hb.payload.timestampServerEmit;
        // log("Single heartBeat latency (websocket server to client) is: ", diff);
        totalDelay += diff;
      });
      const averageLatency = totalDelay / heartBeats.length;
      this.props.onAverageLatencyUpdate(averageLatency);
      this.setState({
        averageLatency
      }, () => {
        if (this.props.isHeartBeatEanbled && this.state.output) {
          sendMiddleC(this);
        }
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
          Click on the labels to switch MIDI output. The average latency is {this.state.averageLatency} ms.
          Your device pairing number is: {this.state.browserRequestId !== null ? this.state.browserRequestId : 'Loading...'}
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
