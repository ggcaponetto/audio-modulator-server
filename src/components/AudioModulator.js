/* eslint-env browser */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Logger from '../util/logger';
let log = null;

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
  const noteOnMessage = [0x90, 0x35, 0x7f];    // note on, middle C, full velocity
  const output = context.state.output;
  // log(`Sending ${JSON.stringify(noteOnMessage)} to: `, output);
  output.send(noteOnMessage);  // omitting the timestamp means send immediately.
}

function onMIDIMessage(event) {
  let str = `MIDI message received at timestamp ${event.timestamp}[${event.data.length} bytes]: `;
  for (let i = 0; i < event.data.length; i++) {
    str += `0x${event.data[i].toString(16)} `;
  }
  // log(str);
}

function injectLoggerToMidiInputs(midiAccess) {
  log('Start loggin MIDI input.');
  midiAccess.inputs.forEach((entry) => {
    // eslint-disable-next-line no-param-reassign
    entry.onmidimessage = onMIDIMessage;
  });
  return midiAccess;
}

const bypassMIDIMoutput = "Bypass";
const grey = '#b5b5b5';
const selectedOutputStyle= { color: grey };

class AudioModulator extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      midi: null,
      isMidiReady: false,
      output: null,
      heartBeats: [],
      averageLatency: 0
    };
    this.getOutputs = this.getOutputs.bind(this);
    this.getLatency = this.getLatency.bind(this);
    log = new Logger("AudioModulator", this.props.config).log;
  }

  getLatency(data){
    // log('AudioModulator getLatency:', data);
    const BUFFER_SIZE = 10;
    const heartBeats = [].concat(this.state.heartBeats);
    if(heartBeats.length >= BUFFER_SIZE){
      heartBeats.shift();
      heartBeats.push(data);
    } else {
      heartBeats.push(data);
    }
    this.setState({
      heartBeats
    }, () => {
      let totalDelay = 0;
      heartBeats.forEach((hb, i) => {
        const diff = hb.timestampClientReceive - hb.timestampServerEmit;
        // log("Single heartBeat latency (websocket server to client) is: ", diff);
        totalDelay = totalDelay + diff;
      });
      const averageLatency = totalDelay / heartBeats.length;
      this.props.onAverageLatencyUpdate(averageLatency);
      this.setState({
        averageLatency
      }, () => {
        sendMiddleC(this);
      });
    });
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
        let config = this.props.config;
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
            if (self.state.output) {
              log('Got websocket data: ', event.data);
              const data = JSON.parse(event.data);
              self.props.onMessage(data);
              if(data.type === "heartBeat"){
                // log('Got heartBeat: ', data);
                data.timestampClientReceive = Date.now();
                self.getLatency(data);
              }
            } else {
              log('No valid midi output selected. Ignoring websocket message.');
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

  render() {

    return (
      <div id="audioModulator row">
        <p>
          Your browser's MIDI is {this.state.isMidiReady ? 'ready' : 'not ready'}.
          The selected MIDI output is <span style={selectedOutputStyle}>{getFormattedOutput(this.state.output)}</span>.
          Click on the labels to switch midi output. The average latency is {this.state.averageLatency} ms.
        </p>
        {this.state.isMidiReady ? this.getOutputs() : null}
      </div>
    );
  }
}

AudioModulator.propTypes = {
  config: PropTypes.object.isRequired,
  onMIDIOutputChange: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onMIDIStatusChange: PropTypes.func.isRequired,
  onAverageLatencyUpdate: PropTypes.func.isRequired
};

export default AudioModulator;
