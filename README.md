# microbit-web-bridge
This project is a webapp-based implementation of the Energy in Schools hub that bridges micro:bit's to the internet over serial commands using a micro:bit and it's radio as a bridge. This WebBridge utilises DAPjs to allow the use of the micro:bits WebUSB functionality to access the serial commands being forwarded from radio packets coming from various micro:bits.

## Feature Request and Issue Tracking
Please add an issue if you wish for any additional features or discover any issues using this project. Tracking changes will keep things organised.

## Local Server
This WebBridge will require an install of the latest version of NodeJS.

**Note: WebUSB is only available via a secure HTTPS connection or ``localhost`` for development.**

### Running

```
git clone https://github.com/Taylor-Woodcock/microbit-web-bridge
cd microbit-web-bridge
npm install
npm start
```

By default, this application is hosted on port 3000 at ``http://localhost:3000/``. This is intended for development as WebUSB requires a secure HTTPs connection, or localhost for development.
This can be changed by heading into the ``bin\ServerConfig.js`` and modifying the configurations.

### Building
Modifications to any of the TypeScript files found in ``public\javascript`` must be compiled into JavaScript and further bundled together using Browserify and minified using uglify.

```
cd public\javascript
browserify WebBridge.js > WebBridge.bundle.js
```

Upon deploying to production, run this process through uglifyjs to remove comments and minify the bundled output.

```
cd public\javascript
browserify WebBridge.js | uglifyjs -c > WebBridge.bundle.js
```

### Node Modules (DAPjs)
At the moment, this repo has not been cleaned up and may contain a load of potentially useless (for this project) node modules.
That being said, this project relies on the [DAPjs](https://github.com/ARMmbed/dapjs) JavaScript interface for the main serial communication between the webapp and the bridging micro:bit.
To install the required node modules, be sure to run ``npm install`` before running the server.

## Project Notes
As JavaScript/TypeScript aren't my strongest language, and my knowledge of NodeJS was lacking, I decided to start with a simple, yet useful project to allow serial communication via the WebUSB standard. This was then improved upon to create a bridge between micro:bits and the internet.

I built this project using WebStorm's brilliant Node.JS Express App generator and utilised the features provided. With the division of business logic and views, modifying the look and feel of the page while maintaining the technical stuff was made very simple. The rendering is achieved via Jade and CSS located in the ``views`` and ``public\stylesheets`` folders, while the logic uses TypeScript found throughout the repo.

**Note: This project is a bit messy at the minute. There are some files within this project that are there purely for local testing purposes and will be removed once complete.**

## Repos
[DAPjs](https://github.com/ARMmbed/dapjs) JavaScript interface to CMSIS-DAP
