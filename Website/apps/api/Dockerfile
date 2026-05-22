# ---- build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install all deps (including devDeps needed for tsc)
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine

WORKDIR /app

# sharp requires native binaries — reinstall prod deps on the target OS
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
