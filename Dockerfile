# Build Stage
FROM node:18-alpine as builder
WORKDIR /app

# Copy root package files (if any workspace logic existed, but now we go into frontend)
# We need to build frontend which is now in /frontend subdirectory

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./
RUN npx vite build

# Production Stage
FROM node:18-alpine
WORKDIR /app

# Setup Backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy backend code
COPY backend/ ./

# Copy built frontend from builder stage to 'frontend/dist' relative to backend
COPY --from=builder /app/frontend/dist ../frontend/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "index.js"]
