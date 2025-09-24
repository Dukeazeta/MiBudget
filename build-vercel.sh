#!/bin/bash

# Install dependencies with pnpm
echo "Installing dependencies with pnpm..."
pnpm install

# Build shared package first
echo "Building shared package..."
pnpm --filter @mibudget/shared build

# Build database package
echo "Building database package..."
pnpm --filter @mibudget/db build

# Build web application
echo "Building web application..."
pnpm --filter mibudget-web build

echo "Build completed successfully!"