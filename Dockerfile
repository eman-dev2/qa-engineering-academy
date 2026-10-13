# Portable container image (any host that runs Docker: a VPS, Fly.io, Railway, ...).
#   docker build -t qa-academy .
#   docker run -p 3000:3000 -v qa-academy-data:/data \
#     -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='a-strong-password-1' qa-academy
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dev dependencies stay installed: `npm start` runs the TypeScript start-up script with tsx.
RUN DATABASE_PATH=/app/data/build.db npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 DATABASE_PATH=/data/academy.db PORT=3000
COPY --from=build /app /app
RUN rm -rf /app/data && mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000
CMD ["npm", "start"]
