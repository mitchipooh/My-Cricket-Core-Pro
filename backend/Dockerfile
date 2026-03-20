FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files and shared package
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY backend ./backend
COPY packages/shared ./packages/shared
COPY tsconfig.json .

# Build
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "start"]
