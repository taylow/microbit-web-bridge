/* HTTP/HTTPS CONFIGS */
exports.HTTP_PORT = 3000;
exports.HTTPS_PORT = 443;

exports.USE_HTTPS = false;
exports.HTTPS_PRIVATE_KEY = "../certs/scc-tw.lancs.ac.uk/privkey.pem";
exports.HTTPS_CERTIFICATE = "../certs/etc/letsencrypt/live/scc-tw.lancs.ac.uk/cert.pem";
exports.HTTPS_CA = "../certs/etc/letsencrypt/live/scc-tw.lancs.ac.uk/chain.pem";