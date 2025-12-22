#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma DB push..."
npx prisma db push --skip-generate

echo "Starting application..."
exec "$@"
