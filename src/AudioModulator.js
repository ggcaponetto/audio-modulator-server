import React, { Component } from 'react';

function getFormattedOutput(output){
  return "ID: " + output.id +
  ", Manufacturer: " + output.manufacturer + ", Name: " + output.name;
}

function sendMiddleC(context) {
  var noteOnMessage = [0x90, 0x35, 0x7f];    // note on, middle C, full velocity
  var output = context.state.output;
  console.log('Sending ' + JSON.stringify(noteOnMessage) + ' to: ', output);
  output.send( noteOnMessage );  //omitting the timestamp means send immediately.
}

function onMIDIMessage( event ) {
  var str = "MIDI message received at timestamp " + event.timestamp + "[" + event.data.length + " bytes]: ";
  for (var i=0; i<event.data.length; i++) {
    str += "0x" + event.data[i].toString(16) + " ";
  }
  console.log( str );
}

function startLoggingMIDIInput( midiAccess, indexOfPort ) {
  console.log('Start loggin midi input.');
  midiAccess.inputs.forEach( function(entry) {entry.onmidimessage = onMIDIMessage;});
}

class AudioModulator extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {
      midi: null,
      isMidiReady: false,
      output: null,
      socketMessages: []
    }
    this.getOutputs = this.getOutputs.bind(this);
  }

  componentDidMount(){
    // console.log('AudioModulator loaded config: ', JSON.stringify(config, null, 4));
    const self = this;
    const onMIDISuccess = ( midiAccess ) => {
      self.setState({
        isMidiReady: true,
        midi: midiAccess
      }, () => {
        // midi is ready
        console.log( "MIDI ready!" );

        startLoggingMIDIInput(self.state.midi);
        console.log("Setting up the client connection to the websocket.");
        let config =  null;
        try {
          config = JSON.parse(document.getElementById('am_data').innerHTML);
          console.log("Parsed configuration: ", JSON.stringify(config, 4, null));

          let host = null;
          if(config.env === 'development'){
            host = config.ws_localhost+':'+config.port+'';
          } else if(config.env === 'production'){
            host = config.wss_host+'/';
          } else {
            throw new Error('Unknown config.env: ', config);
          }
          console.log('Opening socket on: ' + host);
          var ws = new WebSocket(host);
          ws.onmessage = (event) => {
            if(self.state.output){
              console.log('Got message: ', event.data);
              const message = JSON.parse(event.data);
              if(message.midiTest){
                // console.log('Sending middle C note on full velocity.');
                sendMiddleC(self);
              } else {
                console.log('Not a midiTest message.');
              }
              self.setState({
                socketMessages: self.state.socketMessages.concat(event.data)
              });
            } else{
              console.log('No valid midi output selected. Ignoring ws messages.');
            }
          };

        } catch (e){
          console.log("Could not parse and load the configuration passed to the client.", e);
          console.log("JSON you wanted to parse: ", document.getElementById('am_data').innerHTML);
        }
      });
    }

    const onMIDIFailure = (msg) => {
      console.log( "Failed to get MIDI access - " + msg );
    }

    navigator.requestMIDIAccess( { sysex: true } ).then( onMIDISuccess, onMIDIFailure );
  }

  getOutputs(){
    const self = this;
    const getOutputDevices = ( midiAccess ) => {
      const outputs = [];
      for (var entry of midiAccess.outputs) {
        const output = entry[1];
        // console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
        //   "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
        //   "' version:'" + output.version + "'" );
        outputs.push(
          <div outputId={output.id}>
            {getFormattedOutput(output)}
            <button onClick={() => {
              self.setState({
                output
              }, () => {
                console.log('Changed midi output to: ', getFormattedOutput(self.state.output));
              });
            }}>
              select
            </button>
          </div>
        );
      }
      return outputs;
    }
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
        <h2>Welcome to AudioModulator, please choose your midi output.</h2>
        <h3>Midi {this.state.isMidiReady ? 'is' : 'is not'} ready.</h3>
        <h3>
          Selected output: <span style={{ color: 'red' }}>{this.state.output ? getFormattedOutput(this.state.output) : 'none'}</span>.
        </h3>
        {this.state.isMidiReady ? this.getOutputs() : null}
        <div className="socketMessages">
          {JSON.stringify(this.state.socketMessages, null, 4)}
        </div>
      </div>
    );
  }
}

export default AudioModulator;
