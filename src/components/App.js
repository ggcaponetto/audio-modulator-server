/* eslint-env browser */
import React, { Component } from 'react';
import AudioModulator from './AudioModulator';

class App extends Component {
  componentDidMount() {

  }
  render() {
    return (
      <div className="App">
        <div className="midiInfo">
          <AudioModulator
            onMIDIOutputChange={(output) => {
              console.log('MIDI output changed: ', output);
            }}
            onMessage={(data) => {
              console.log('Message received: ', data);
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
