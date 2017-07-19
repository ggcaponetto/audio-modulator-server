const express = require('express')
var path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

const buildFolderPath = 'build';
app.use(express.static(buildFolderPath));

app.listen(PORT, function () {
  console.log('AudioModulator app is listening on port ' +  PORT);
})
