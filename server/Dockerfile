FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy server directory contents
COPY . .

# Install app dependencies
RUN npm install --only=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the app
CMD ["node", "app.js"] 