var fs = require("fs-extra");
console.log('Copying build folder content to build_custom folder and removing index.html');
fs.copy(__dirname + "/../build", __dirname + "/../build_custom", function (err) {
  if (err) return console.error("Build custom error.", err)
  console.log('Build custom success!')
  fs.unlink(__dirname + "/../build/index.html", (err) => {
    if (err) return console.error("Could not delete index.html", err);
    console.log('successfully deleted ' + __dirname + "/../build/index.html");
  });
});
