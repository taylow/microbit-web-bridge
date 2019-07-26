FROM node:alpine

COPY . /webhub
WORKDIR /webhub

RUN npm install

CMD npm run start -- --host 0.0.0.0
