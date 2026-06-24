FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN mkdir -p /data \
  && chown node:node /data

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js ./app.js
COPY public ./public
COPY src ./src

USER node

EXPOSE 7000

CMD ["node", "app.js"]
