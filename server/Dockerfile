FROM node:18-slim

# Install required system dependencies for sqlite3
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory and set ownership
WORKDIR /usr/src/app

# Create data directory for SQLite with proper permissions
RUN mkdir -p /data && \
    chown -R node:node /data

# Switch to non-root user for npm operations
USER node

# Copy package files with correct ownership
COPY --chown=node:node package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm install \
    --no-optional \
    --production \
    --verbose \
    --unsafe-perm

# Copy the rest of the application
COPY --chown=node:node . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 