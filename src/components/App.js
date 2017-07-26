/* eslint-env browser */
import React, { Component } from 'react';
import AudioModulator from './AudioModulator';

class App extends Component {
  componentDidMount() {

  }
  render() {
    return (
      <div className="App" style={{ margin: 0, padding: 0 }}>
        <div className="midiInfo">
          <AudioModulator
            onMIDIOutputChange={(output) => {
              console.log('onMIDIOutputChange: ', output);
            }}
            onMessage={(data) => {
              console.log('onMessage: ', data);
            }}
            onMIDIStatusChange={(data) => {
              console.log('onMIDIStatusChange: ', data);
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
