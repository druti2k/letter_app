FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install app dependencies
RUN npm install --only=production

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

# Switch to non-root user
USER node

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 