# Stage 1: Build
FROM node:18-alpine AS builder

# Install ImageMagick and build dependencies
RUN apk add --no-cache \
    imagemagick \
    python3 \
    make \
    g++ \
    vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY spec ./spec

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install ImageMagick and runtime dependencies for Sharp
RUN apk add --no-cache \
    imagemagick \
    vips

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy views if they exist
COPY views ./views 2>/dev/null || true

# Create cache and tmp directories
RUN mkdir -p cache tmp && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port (default 5060, can be overridden)
EXPOSE 5060

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5060/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["npm", "start"]
