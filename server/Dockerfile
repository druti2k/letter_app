# Build stage
FROM node:16-bullseye AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source
COPY . .

# Production stage
FROM node:16-bullseye-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y sqlite3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built node modules and source
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build .

# Create data directory
RUN mkdir -p /data && \
    chown -R node:node /data /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER node

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 