import React, { Component } from 'react';

function getFormattedOutput(output){
  return "ID: " + output.id +
  ", Manufacturer: " + output.manufacturer + ", Name: " + output.name;
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
      console.log( "MIDI ready!" );
      this.setState({
        isMidiReady: true,
        midi: midiAccess
      });
    }

    const onMIDIFailure = (msg) => {
      console.log( "Failed to get MIDI access - " + msg );
    }

    navigator.requestMIDIAccess( { sysex: true } ).then( onMIDISuccess, onMIDIFailure );

    window.onload = () => {
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
          console.log('Got message', event);
          self.setState({
            socketMessages: self.state.socketMessages.concat(event.data)
          });
        };

      } catch (e){
        console.log("Could not parse and load the configuration passed to the client.", e);
        console.log("JSON you wanted to parse: ", document.getElementById('am_data').innerHTML);
      }
    }
  }

  getOutputs(){
    const outputs = [];

    const listOutputs = ( midiAccess ) => {
      for (var entry of midiAccess.outputs) {
        var output = entry[1];
        console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
          "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
          "' version:'" + output.version + "'" );
        const setStateFn = (output) => {
          this.setState({
            output
          });
        };
        outputs.push(
          <div outputId={output.id}>
            {getFormattedOutput(output)}
            <button onClick={setStateFn(output)}>
              select
            </button>
          </div>
        );
      }
    }
    listOutputs(this.state.midi);
    return (
      <div>
        {outputs}
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
