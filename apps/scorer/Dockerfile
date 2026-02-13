FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files if any, and workspaces
COPY package*.json ./
COPY apps/scorer/package*.json ./apps/scorer/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/scorer ./apps/scorer
COPY packages/shared ./packages/shared
COPY tsconfig.json .

# Build the app
WORKDIR /app/apps/scorer
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/apps/scorer/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
