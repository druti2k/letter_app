FROM node:18-slim

# Install required system dependencies for sqlite3
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

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