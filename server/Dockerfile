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

# Copy package files
COPY package*.json ./

# Install dependencies one by one
RUN npm install sqlite3@5.0.8 && \
    npm install connect-sqlite3@0.9.13 && \
    npm install express@4.18.2 && \
    npm install express-session@1.17.3 && \
    npm install cors@2.8.5 && \
    npm install dotenv@16.0.3 && \
    npm install bcryptjs@2.4.3 && \
    npm install google-auth-library@8.7.0 && \
    npm install googleapis@118.0.0 && \
    npm install jsonwebtoken@9.0.0 && \
    npm install sequelize@6.31.0

# Copy application files
COPY app.js ./
COPY routes ./routes
COPY models ./models
COPY services ./services

# Debug: List contents to verify files
RUN echo "Current directory structure:" && \
    ls -la && \
    echo "\nContents of routes:" && \
    ls -la routes && \
    echo "\nContents of models:" && \
    ls -la models && \
    echo "\nContents of services:" && \
    ls -la services

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