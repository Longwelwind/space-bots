FROM node:18.17.1-alpine3.17

WORKDIR /opt/app

COPY src ./src
COPY package*.json .
COPY tsconfig.json .
COPY Procfile .

RUN npm ci

CMD [ "npm", "start" ]