FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Edge case: install build essentials required for native modules like bcrypt
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package descriptors first to maximize Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Change file ownership to the pre-existing non-root user 'node'
RUN chown -R node:node /usr/src/app

# Drop root privileges
USER node

# Expose default application port
EXPOSE 8000

# Exec form for clean SIGTERM handling
CMD ["node", "src/index.js"]

