/* eslint-env browser */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

function getFormattedOutput(output) {
  // return `ID: ${output.id
  // }, Manufacturer: ${output.manufacturer}, Name: ${output.name}`;
  if (!output) {
    return 'No MIDI output';
  }
  if (output.manufacturer) {
    return `${output.manufacturer}, ${output.name}`;
  }
  return `${output.name}`;
}

function sendMiddleC(context) {
  const noteOnMessage = [0x90, 0x35, 0x7f];    // note on, middle C, full velocity
  const output = context.state.output;
  console.log(`Sending ${JSON.stringify(noteOnMessage)} to: `, output);
  output.send(noteOnMessage);  // omitting the timestamp means send immediately.
}

function onMIDIMessage(event) {
  let str = `MIDI message received at timestamp ${event.timestamp}[${event.data.length} bytes]: `;
  for (let i = 0; i < event.data.length; i++) {
    str += `0x${event.data[i].toString(16)} `;
  }
  console.log(str);
}

function injectLoggerToMidiInputs(midiAccess) {
  console.log('Start loggin MIDI input.');
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
      output: null
    };
    this.getOutputs = this.getOutputs.bind(this);
  }

  componentDidMount() {
    // console.log('AudioModulator loaded config: ', JSON.stringify(config, null, 4));
    const self = this;
    const onMIDISuccess = (midiAccess) => {
      self.setState({
        isMidiReady: true,
        midi: injectLoggerToMidiInputs(midiAccess)
      }, () => {
        // midi is ready
        this.props.onMIDIStatusChange({ isRedy: true });
        console.log('MIDI ready!');
        let config = null;
        try {
          config = JSON.parse(document.getElementById('am_data').innerHTML);
          console.log('Parsed configuration: ', JSON.stringify(config, 4, null));

          let websocketHost = null;
          if (config.env === 'production') {
            websocketHost = `${config.wss_host}`;
          } else if (config.env === 'development') {
            websocketHost = `${config.ws_host}:${config.port}`;
          } else {
            throw new Error('Unsupported "config.env", please check the NODE_ENV supplied to the start script.', config.env);
          }
          console.log(`Opening socket on: ${websocketHost}`);
          const ws = new WebSocket(websocketHost);
          ws.onmessage = (event) => {
            if (self.state.output) {
              console.log('Got message: ', event.data);
              self.props.onMessage(event.data);
              sendMiddleC(self);
            } else {
              console.log('No valid midi output selected. Ignoring websocket message.');
            }
          };
        } catch (e) {
          console.log('Could not parse and load the configuration passed to the client.', e);
          console.log('JSON you wanted to parse: ', document.getElementById('am_data').innerHTML);
        }
      });
    };

    const onMIDIFailure = (msg) => {
      console.log(`Failed to get MIDI access - ${msg}`);
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
          className="midiOutputSelection"
          onClick={() => {
            self.setState({
              output: null
            }, () => {
              console.log('Changed midi output to: ', 'No MIDI output');
              self.props.onMIDIOutputChange(self.state.output);
            });
          }}
        >
          <p>
            {'No MIDI output'}
          </p>
        </div>
      ];
      midiAccess.outputs.forEach((entry) => {
        const output = entry;
        outputs.push(
          <div
            role="button"
            key={`${output.id}`}
            className="midiOutputSelection"
            onClick={() => {
              self.setState({
                output
              }, () => {
                console.log('Changed midi output to: ', 'No MIDI output');
                self.props.onMIDIOutputChange(self.state.output);
              });
            }}
          >
            <p>
              {getFormattedOutput(output)}
            </p>
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
      <div id="audioModulator">
        <h1>Midi settings</h1>
        <p>
          Midi status: {this.state.isMidiReady ? 'ready' : 'not ready'}.
        </p>
        <p>
          Selected output: <span style={{}}>{getFormattedOutput(this.state.output)}.</span>
        </p>
        {this.state.isMidiReady ? this.getOutputs() : null}
      </div>
    );
  }
}

AudioModulator.propTypes = {
  onMIDIOutputChange: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onMIDIStatusChange: PropTypes.func.isRequired
};

export default AudioModulator;
