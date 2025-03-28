FROM node:16-bullseye-slim

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Debug: Show package.json content and environment
RUN echo "Package.json contents:" && \
    cat package.json && \
    echo "\nNode version:" && \
    node --version && \
    echo "\nNPM version:" && \
    npm --version

# Install dependencies with legacy peer deps
RUN npm install --production --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Create data directory for SQLite
RUN mkdir -p /data && \
    chown -R node:node /data /usr/src/app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER node

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 