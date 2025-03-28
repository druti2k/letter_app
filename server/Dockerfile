FROM node:18-slim

# Install required system dependencies for sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Set npm to verbose and install dependencies
RUN npm config set loglevel verbose && \
    npm install --only=production --no-optional

# Copy the rest of the application
COPY . .

# List contents for debugging
RUN echo "Current directory contents:" && \
    ls -la && \
    echo "Node version:" && \
    node --version && \
    echo "NPM version:" && \
    npm --version

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Set proper ownership
RUN chown -R node:node .

# Switch to non-root user
USER node

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 