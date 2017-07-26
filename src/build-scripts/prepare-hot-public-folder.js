/* eslint-disable camelcase */
const fs = require('fs-extra');
const config = require('../../config/config.js').config;

require.extensions['.html'] = function (module, filename) {
  // eslint-disable-next-line no-param-reassign
  module.exports = fs.readFileSync(filename, 'utf8');
};
// read "index.html" from "public" folder
const index = require('../../public/index.html');
// prepare the config
const NODE_ENV = process.env.NODE_ENV;
const modifiedConfiguration = config.development;
modifiedConfiguration.env = NODE_ENV;
console.log(`Running src/build-scripts/prepare-hot-public-folder.js with NODE_ENV=${NODE_ENV}.`);
const configJson = JSON.stringify(modifiedConfiguration, null, 4);
console.log('Injecting configuration into "index.html" file.', configJson);
const modifiedIndex = index.replace('__AM_DATA__', configJson);
// delete "index.html" from "public" folder
fs.unlink(`${__dirname}/../../public/index.html`, (err_3) => {
  if (err_3) {
    throw new Error('Could not delete "index.html" from folder "public".');
  }
  console.log('Successfully deleted "index.html" from "public" folder.');
  // write the modified "index.html" into folder "public"
  fs.writeFile(`${__dirname}/../../public/index.html`, modifiedIndex, (err) => {
    if (err) {
      throw new Error('Could not write the modified "index.html" into folder "public".');
    }
    console.log('The modified "index.html" has been written into folder "public".');
  });
});
