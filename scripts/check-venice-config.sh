#!/bin/bash

# Script to check Venice API configuration on Hetzner server via SSH
# This script connects to the server and verifies the Venice API key configuration

set -e

echo "🔍 Checking Venice API configuration on Hetzner server..."

# Check if SSH connection to snel-bot is available
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes snel-bot "echo 'SSH connection successful'" &>/dev/null; then
    echo "❌ Cannot connect to snel-bot via SSH. Please check:"
    echo "   - SSH key authentication is properly set up"
    echo "   - Server is running and accessible"
    echo "   - SSH configuration in ~/.ssh/config is correct"
    exit 1
fi

echo "✅ SSH connection to snel-bot is working"

# Check if the environment file exists on the server and contains Venice configuration
echo "📄 Checking environment configuration on server..."
VENICE_CONFIG_CHECK=$(ssh snel-bot "
    if [ -f /opt/familexyz/.env ]; then
        echo 'Environment file exists'
        if grep -q 'VENICE_API_KEY' /opt/familexyz/.env; then
            echo 'Venice API key found in server config'
            grep 'VENICE_API_KEY' /opt/familexyz/.env | sed 's/=.*/=***HIDDEN***/'
        else
            echo '⚠️  Venice API key NOT found in server config'
        fi
    else
        echo '⚠️  Environment file does not exist at /opt/familexyz/.env'
    fi
")

echo "$VENICE_CONFIG_CHECK"

# Check if docker containers are running and their environment
echo "🐳 Checking Docker containers..."
CONTAINER_STATUS=$(ssh snel-bot "
    cd /opt/familexyz 2>/dev/null || echo 'Directory does not exist'
    if docker compose ps 2>/dev/null | grep -q 'familexyz'; then
        docker compose ps
    else
        echo 'No familexyz containers found or Docker not running'
    fi
")

echo "$CONTAINER_STATUS"

# Check if the Venice API key is accessible within the container environment
echo "🔍 Checking Venice configuration in running containers..."
CONTAINER_ENV_CHECK=$(ssh snel-bot "
    if docker ps | grep -q familexyz-backend; then
        VENICE_KEY_IN_CONTAINER=\$(docker exec -t familexyz-backend env | grep VENICE_API_KEY | sed 's/=.*/=***HIDDEN***/' || echo 'Not found in container environment')
        echo \"Venice API key in container: \$VENICE_KEY_IN_CONTAINER\"
    else
        echo 'Container not running - cannot check container environment'
    fi
")

echo "$CONTAINER_ENV_CHECK"

echo "✅ Venice API configuration check completed"
echo ""
echo "Summary:"
echo "- SSH connection to snel-bot: ✅ Working"
if echo "$VENICE_CONFIG_CHECK" | grep -q "Venice API key found"; then
    echo "- Venice API key in server config: ✅ Found"
else
    echo "- Venice API key in server config: ❌ Missing"
fi
if echo "$CONTAINER_ENV_CHECK" | grep -q "***HIDDEN***"; then
    echo "- Venice API key in container: ✅ Found"
else
    echo "- Venice API key in container: ❌ Missing or not running"
fi