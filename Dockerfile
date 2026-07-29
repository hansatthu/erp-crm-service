# Base image
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
