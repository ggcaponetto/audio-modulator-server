const express = require('express')
var path = require('path');
const app = express();

const APP_PORT = process.env.PORT;

const buildFolderPath = 'build';
app.use(express.static(buildFolderPath));

app.listen(APP_PORT, function () {
  console.log('AudioModulator app is listening on port ' +  APP_PORT);
})
