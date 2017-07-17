import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import io from 'socket.io-client';

ReactDOM.render(<App io={io}/>, document.getElementById('root'));
registerServiceWorker();
