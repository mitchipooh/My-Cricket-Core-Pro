FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files if any, and workspaces
COPY package*.json ./
COPY apps/admin/package*.json ./apps/admin/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/admin ./apps/admin
COPY packages/shared ./packages/shared
COPY tsconfig.json .

# Build the app
WORKDIR /app/apps/admin
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
