FROM node:14-buster

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all application files first
COPY . .

# Verify app.js exists and show its contents
RUN ls -la /app/app.js && \
    echo "Contents of app.js:" && \
    cat /app/app.js

# Install dependencies
RUN npm install

# Create data directory
RUN mkdir -p /data && \
    chown -R node:node /data /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER node

EXPOSE 3001

# Start the app with full path
CMD ["node", "/app/app.js"] 