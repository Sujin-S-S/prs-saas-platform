# ==========================================
# STAGE 1: BUILD
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management descriptors
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source and Prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client and build TypeScript to JS
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 2: RUNNER
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime files
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Clean up dev dependencies to optimize image size
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]
