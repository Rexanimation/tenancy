# Build Stage
FROM node:18-alpine as builder
WORKDIR /app

# Copy package files (root)
COPY package.json package-lock.json ./
# Install root dependencies (including dev deps for build)
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Copy server files
COPY server/package.json server/package-lock.json* ./server/
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server/ ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ../dist

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

# Expose port (Render uses 10000 by default often, or 5000)
EXPOSE 10000

# Start command
CMD ["node", "index.js"]
