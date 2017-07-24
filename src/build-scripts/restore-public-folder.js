/* eslint-disable camelcase */
const fs = require('fs-extra');

// remove public folder
try {
  fs.removeSync(`${__dirname}/../../public`);
} catch (e) {
  throw new Error('Could not remove the "public" folder.');
}

fs.copy(`${__dirname}/../../public-original`, `${__dirname}/../../public`, (err_1) => {
  if (err_1) {
    throw new Error('Could not copy the "public-original" folder to "public" folder.');
  }
  console.log('Restored the "public" folder from "public-original"');
});
