# microbit-web-bridge
This project is a webapp-based implementation of the Energy in Schools hub that bridges micro:bit's to the internet over serial commands using a micro:bit and it's radio as a bridge. This WebBridge utilises DAPjs to allow the use of the micro:bits WebUSB functionality to access the serial commands being forwarded from radio packets coming from various micro:bits.

## Feature Request and Issue Tracking
Please add an issue if you wish for any additional features or discover any issues using this project. Tracking changes will keep things organised.

**Note: WebUSB is only available via a secure HTTPS connection or ``localhost`` for development.**

### Running

```
git clone https://github.com/Taylor-Woodcock/microbit-web-bridge
cd microbit-web-bridge
npm install
npm start
```

By default, this application is hosted on port 3000 at ``http://localhost:8080/``. This is intended for development as WebUSB requires a secure HTTPs connection, or localhost for development.

### Building
```
npm run build // translation localhost:4000
npm run build:staging // translations staging
npm run build:production // translatinos production
```

### Local development
For local development setup you might be interested in launching chrome without internet security with disabled CORS
`npm run chrome-without-web-security`

### Deploying to S3
To deploy built version on S3 bucket you need to install [s3deploy](https://github.com/bep/s3deploy) tool.
After installation use these commands to build and then deploy to S3
```npm
npm run deploy:staging
npm run deploy:prod
```

Deploy configuration is inside `deployConfig` section of `package.json` file. Also refer to [s3deploy](https://github.com/bep/s3deploy) 
tool configuration for more details.

### Node Modules (DAPjs)
At the moment, this repo has not been cleaned up and may contain a load of potentially useless (for this project) node modules.
That being said, this project relies on the [DAPjs](https://github.com/ARMmbed/dapjs) JavaScript interface for the main serial communication between the webapp and the bridging micro:bit.
To install the required node modules, be sure to run ``npm install`` before running the server.

## Repos
[DAPjs](https://github.com/ARMmbed/dapjs) JavaScript interface to CMSIS-DAP
