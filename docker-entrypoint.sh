#!/bin/sh
set -e

# Write environment variables to .env file for Next.js
echo "Writing environment variables to .env file..."
cat > /app/.env << EOF
# Docker environment - generated from docker-compose env vars
DATABASE_URL=${DATABASE_URL}
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
NANOBANANA_API_KEY=${NANOBANANA_API_KEY}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
S3_REGION=${S3_REGION}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
S3_ENDPOINT=${S3_ENDPOINT}
LIVEBLOCKS_SECRET_KEY=${LIVEBLOCKS_SECRET_KEY}
EOF

echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma DB push..."
npx prisma db push --skip-generate

echo "Starting application..."
exec "$@"
