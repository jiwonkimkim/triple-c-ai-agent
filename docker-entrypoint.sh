#!/bin/sh
set -e

echo "Running Prisma DB push..."
npx prisma db push --skip-generate

echo "Starting application..."
exec "$@"
