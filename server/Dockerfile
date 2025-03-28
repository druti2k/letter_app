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

# Debug: Show build context
RUN pwd && \
    echo "Build context before copy:"

# Copy files explicitly
COPY package*.json ./
COPY app.js ./
COPY routes ./routes
COPY models ./models
COPY services ./services

# Debug: Show copied files
RUN echo "Files in /app:" && \
    ls -la /app && \
    echo "\nContents of current directory:" && \
    ls -la ./ && \
    echo "\nFull path of app.js:" && \
    find / -name app.js 2>/dev/null

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
CMD ["node", "./app.js"] 