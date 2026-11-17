FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build
FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4310
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY src/server ./src/server
COPY src/shared ./src/shared
USER node
EXPOSE 4310
HEALTHCHECK --interval=30s --timeout=4s CMD node -e "fetch('http://127.0.0.1:4310/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","--import","tsx","src/server/index.ts"]
