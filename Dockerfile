# ----------------------------------------------------
# Stage 1: Build Frontend & Backend
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies for build)
RUN npm run install:all

# Copy all source files
COPY client/ ./client/
COPY server/ ./server/

# Build client Vite bundle & server TypeScript
RUN npm run build

# ----------------------------------------------------
# Stage 2: Production Runtime (Lightweight)
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy package definitions for production dependencies
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN cd server && npm install --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist

# Expose server port
EXPOSE 4000

# Run single-process production server
CMD ["node", "server/dist/index.js"]
