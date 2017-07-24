/* eslint-env browser */
import React, { Component } from 'react';
import AudioModulator from './AudioModulator';

class App extends Component {
  componentDidMount() {

  }
  render() {
    return (
      <div className="App">
        <div className="App-header" style={{ backgroundColor: 'black' }}>
          <h2 style={{ color: 'white', fontFamily: 'Arial' }}>Welcome to AudioModulator</h2>
        </div>
        <AudioModulator
          onMIDIOutputChange={(output) => {
            console.log('MIDI output changed: ', output);
          }}
          onMessage={(data) => {
            console.log('Message received: ', data);
          }}
        />
      </div>
    );
  }
}

export default App;
