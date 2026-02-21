# Backend New Farol - Node.js/Express
FROM node:18-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
USER app

EXPOSE 8000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:8000/health 2>/dev/null || exit 1

CMD ["node", "server.js"]
