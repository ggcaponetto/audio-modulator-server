import React, { Component } from 'react';

const io = require('socket.io-client');

const SOCKET_PORT = 8080;

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

    var socket = io.connect('http://localhost:' + SOCKET_PORT);
    socket.on('news', (data) => {
      console.log(data);
      this.setState({
        socketMessages: this.state.socketMessages.concat(data)
      });
      socket.emit('my other event', { my: 'data' });
    });
    console.log(`Socket listeners have been set up. Using port: ${SOCKET_PORT}`, socket);
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
