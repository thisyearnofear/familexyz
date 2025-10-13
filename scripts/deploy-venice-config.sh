#!/bin/bash

# Script to deploy Venice API configuration to Hetzner server

echo "🔧 Setting up Venice API configuration on Hetzner server..."

# Copy the local .env file to the server
echo "📋 Copying environment configuration to server..."
scp .env snel-bot:/tmp/familexyz.env

# Move the .env file to the correct location on the server
echo "📁 Moving environment file to correct location..."
ssh snel-bot "
    # Create the directory if it doesn't exist
    sudo mkdir -p /opt/familexyz
    
    # Move the environment file to the correct location
    sudo mv /tmp/familexyz.env /opt/familexyz/.env
    
    # Set appropriate permissions
    sudo chmod 600 /opt/familexyz/.env
    
    # Verify the file exists
    if [ -f /opt/familexyz/.env ]; then
        echo '✅ Environment file successfully deployed'
        echo 'Contents (first 5 lines):'
        head -5 /opt/familexyz/.env
    else
        echo '❌ Failed to deploy environment file'
    fi
"

echo "🐳 Setting up Docker containers..."

ssh snel-bot "
    # Navigate to the deployment directory
    cd /opt/familexyz
    
    # If docker-compose.yml doesn't exist, copy it from the repo
    if [ ! -f docker-compose.yml ]; then
        echo '📋 Downloading docker-compose.yml...'
        curl -fsSL https://raw.githubusercontent.com/thisyearnofear/familexyz/develop/docker-compose.yml -o docker-compose.yml
    fi
    
    # Pull the latest Docker image
    echo '📦 Pulling latest Docker images...'
    docker compose pull
    
    # Start the containers
    echo '🚀 Starting Docker containers...'
    docker compose up -d
    
    # Wait a moment for containers to start
    sleep 10
    
    # Check container status
    echo '📊 Container status:'
    docker compose ps
    
    # Check the logs for any issues
    echo '📋 Container logs (last 10 lines):'
    docker compose logs --tail=10 familexyz-backend
"

echo "✅ Venice API configuration deployed to server"
echo ""
echo "To verify the setup, you can run:"
echo "  ssh snel-bot 'cd /opt/familexyz && docker compose ps'"
echo "  ssh snel-bot 'cd /opt/familexyz && docker compose logs familexyz-backend'"