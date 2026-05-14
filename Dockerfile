FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN mkdir -p /data \
  && chown node:node /data

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js ./app.js
COPY config ./config
COPY src ./src

USER node

CMD ["node", "app.js"]
