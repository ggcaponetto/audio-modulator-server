const fs = require('fs-extra');

/*
1. we serve the static files form folder "build" after removing the index.html
2. we copy the files form folder "build" into "build_custom" to backup the original index.html
summary: we serve a modded index.html + static files form build folder.
*/
console.log('Copying build folder content to build_custom folder and removing index.html.');
fs.copy(`${__dirname}/../build`, `${__dirname}/../build_custom`, (err) => {
  if (err) return console.error('Build custom error.', err);
  console.log('Build custom success!');
  fs.unlink(`${__dirname}/../build/index.html`, (error) => {
    if (error) return console.error('Could not delete index.html', error);
    return console.log(`Successfully deleted ${__dirname}/../build/index.html`);
  });
  return true;
});
