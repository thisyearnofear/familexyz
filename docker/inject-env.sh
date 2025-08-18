#!/bin/sh

# Inject environment variables into nginx configuration and frontend app
# This allows runtime configuration without rebuilding the image

# Set default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-"http://localhost:3000"}

# Replace environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Create runtime environment config for frontend
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  BACKEND_URL: "${BACKEND_URL}",
  ENVIRONMENT: "${NODE_ENV:-production}",
  VERSION: "${APP_VERSION:-1.0.0}",
  API_TIMEOUT: "${API_TIMEOUT:-30000}",
  ENABLE_ANALYTICS: "${ENABLE_ANALYTICS:-false}",
  SENTRY_DSN: "${SENTRY_DSN:-}",
  WEBSOCKET_URL: "${WEBSOCKET_URL:-${BACKEND_URL}/ws}"
};
EOF

echo "Environment configuration injected successfully"
echo "Backend URL: ${BACKEND_URL}"
echo "Environment: ${NODE_ENV:-production}"
