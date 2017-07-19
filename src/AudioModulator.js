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

    var host = 'ws://murmuring-dusk-99045.herokuapp.com/';
    var ws = new WebSocket(host);
    ws.onmessage = (event) => {
      console.log('Got message', event);
      self.setState({
        socketMessages: self.state.socketMessages.concat(event.data)
      });
    };
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
