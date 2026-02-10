# Backend New Farol - Node.js/Express
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

ENV NODE_ENV=production
CMD ["node", "server.js"]
