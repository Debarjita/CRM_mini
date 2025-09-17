# Multi-stage Dockerfile for Railway deployment
# This builds the React frontend and serves it with the Node.js backend

FROM node:18-alpine as frontend-builder

# Build the React frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:18-alpine as backend

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy the built frontend from the previous stage to backend's public folder
COPY --from=frontend-builder /app/frontend/build ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose the port (Railway will set the PORT env variable)
EXPOSE $PORT

# Start the server
CMD ["node", "server.js"]