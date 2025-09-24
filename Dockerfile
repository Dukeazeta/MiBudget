# Use Node.js 18 alpine for smaller image size
FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Build the application
RUN pnpm --filter shared build && pnpm --filter db build && pnpm --filter mibudget-server build

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["pnpm", "--filter", "mibudget-server", "start"]