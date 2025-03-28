FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the app
CMD ["node", "app.js"] 