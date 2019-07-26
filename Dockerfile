FROM node:alpine

WORKDIR /webhub

COPY package.json ./

# alpine image does not have node-gyp stuff https://github.com/nodejs/docker-node/issues/282
# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk --no-cache --virtual build-dependencies add \
    python \
    alpine-sdk \
    libusb-dev \
    eudev-dev \
    linux-headers \
    && npm install \
    && apk del build-dependencies

COPY . /webhub

CMD npm run start -- --host 0.0.0.0
