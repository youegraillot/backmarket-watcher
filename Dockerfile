FROM node:16-alpine
WORKDIR /home/node/app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN mkdir -p /home/node/.config/backmarket-watcher-nodejs && \
    chown -R node:node /home/node/
USER node
VOLUME /home/node/.config/backmarket-watcher-nodejs
CMD [ "node", "index.js", "watch" ]
