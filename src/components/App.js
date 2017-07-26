/* eslint-env browser */
import React, { Component } from 'react';
import AudioModulator from './AudioModulator';
import Logger from '../util/logger';
let log = null;

function parseConfig(){
  try {
    const config = JSON.parse(document.getElementById('am_data').innerHTML);
    console.log('Parsed configuration: ', JSON.stringify(config, 4, null));
    return config;
  } catch (e) {
    console.log('Could not parse and load the configuration passed to the client.', e);
    console.log('JSON you wanted to parse: ', document.getElementById('am_data').innerHTML);
    throw new Error('Unable to parse configuration json.');
  }
}

class App extends Component {
  constructor(props, context){
    super(props, context);
    this.state = {
      config: null,
      isMounted: false
    }
  }
  componentDidMount() {
    this.setState({
      config: parseConfig(),
      isMounted: true
    }, () => {
      const logger = new Logger("App", this.state.config);
      log = logger.log;
      console.log("App logger has been configured.", logger);
    });
  }
  render() {
    if(!this.state.isMounted){
      return(<h1>AudioModulator is loading...</h1>);
    }
    return (
      <div className="App container">
        <div className="midiInfo row">
          <AudioModulator
            config={this.state.config}
            onMIDIOutputChange={(output) => {
              // log('onMIDIOutputChange: ', output);
            }}
            onMessage={(data) => {
              // log('onMessage: ', data);
            }}
            onMIDIStatusChange={(data) => {
              // log('onMIDIStatusChange: ', data);
            }}
            onAverageLatencyUpdate={(averageLatency) => {
              // log('onAverageLatencyUpdate: ', averageLatency);
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
