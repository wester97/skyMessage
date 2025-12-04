#!/bin/bash
# Deployment script for Firebase Functions
# Handles .env file to prevent conflicts with secrets during deployment

set -e

echo "🚀 Deploying Firebase Functions..."

# Check if .env exists
if [ -f .env ]; then
  echo "📦 Temporarily renaming .env to prevent deployment conflicts..."
  mv .env .env.backup
  ENV_BACKED_UP=true
else
  ENV_BACKED_UP=false
fi

# Deploy functions
if [ "$1" == "askSky" ]; then
  echo "📤 Deploying askSky function..."
  firebase deploy --only functions:askSky
elif [ "$1" == "all" ] || [ -z "$1" ]; then
  echo "📤 Deploying all functions..."
  firebase deploy --only functions
else
  echo "📤 Deploying function: $1"
  firebase deploy --only functions:$1
fi

# Restore .env if it was backed up
if [ "$ENV_BACKED_UP" = true ]; then
  echo "✅ Restoring .env file..."
  mv .env.backup .env
fi

echo "✅ Deployment complete!"

