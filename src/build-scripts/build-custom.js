/* eslint-disable camelcase */
const fs = require('fs-extra');

fs.copy(`${__dirname}/../../build`, `${__dirname}/../../build-custom`, (err_1) => {
  if (err_1) {
    throw new Error('Could not copy "build" folder to "build-custom" folder');
  }
  console.log('Copied folder "build" to "build-custom".');
  fs.copy(`${__dirname}/../../build`, `${__dirname}/../../build-custom-no-index`, (err_2) => {
    if (err_2) {
      throw new Error('Could not copy "build" folder to "build-custom-no-index" folder');
    }
    console.log('Copied folder "build" to "build-custom-no-index".');
    fs.unlink(`${__dirname}/../../build-custom-no-index/index.html`, (err_3) => {
      if (err_3) {
        throw new Error('Could not delete "index.html" from folder "build-custom-no-index".');
      }
      console.log('Successfully deleted "index.html" from "build-custom-no-index" folder.');
    });
  });
});
