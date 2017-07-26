## Production
"build-custom-no-index" folder gets served statically with a runtime modified index.html coming from "build" folder
## Development Static
"build-custom-no-index" folder gets served statically with a runtime modified index.html coming from "build" folder
### Development Hot
1. creates a websocket server with the port specified in "config.js" under development.
1. builds the "build" folder starting from "public" folder
1. serves the "build folder"
