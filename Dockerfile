# ---- Stage 1: build (compile TypeScript -> dist/) ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) using the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Compile the source.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime (production-only deps + compiled output) ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies in the final image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Bring in the compiled JS from the build stage.
COPY --from=builder /app/dist ./dist

# Run as the built-in non-root user shipped with the node image.
USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
