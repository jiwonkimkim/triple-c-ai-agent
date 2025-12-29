#!/bin/sh
set -e

# Clear .env file to use docker-compose environment variables instead
echo "Clearing .env to use Docker environment variables..."
echo "# Docker environment - using docker-compose env vars" > /app/.env

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma DB push..."
npx prisma db push --skip-generate

echo "Starting application..."
exec "$@"
