#!/bin/bash

# FamilyXYZ Deployment Test Script
# Tests the Docker-based deployment to ensure everything is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_HOST="${1:-localhost}"
SERVER_PORT="${2:-3000}"
HEALTH_PORT="${3:-3001}"
TIMEOUT=30

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

test_docker_status() {
    log "🐳 Testing Docker container status..."
    
    if docker compose ps | grep -q "Up\|healthy"; then
        success "Docker containers are running"
        docker compose ps
    else
        error "Docker containers are not running properly"
        docker compose ps
        return 1
    fi
}

test_health_endpoint() {
    log "🏥 Testing health endpoint..."
    
    local url="http://${SERVER_HOST}:${HEALTH_PORT}/health"
    
    if curl -f -s --max-time $TIMEOUT "$url" > /dev/null; then
        success "Health endpoint is responding"
        curl -s "$url"
    else
        error "Health endpoint is not responding at $url"
        return 1
    fi
}

test_main_endpoint() {
    log "🌐 Testing main API endpoint..."
    
    local url="http://${SERVER_HOST}:${SERVER_PORT}/"
    
    if curl -f -s --max-time $TIMEOUT "$url" > /dev/null; then
        success "Main API endpoint is responding"
    else
        warn "Main API endpoint may not be responding at $url (this might be expected)"
    fi
}

test_resource_usage() {
    log "📊 Checking resource usage..."
    
    # Check memory usage
    local mem_usage=$(docker stats --no-stream --format "{{.MemPerc}}" familexyz-backend | sed 's/%//')
    if (( $(echo "$mem_usage < 80" | bc -l) )); then
        success "Memory usage is acceptable: ${mem_usage}%"
    else
        warn "Memory usage is high: ${mem_usage}%"
    fi
    
    # Check CPU usage
    local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" familexyz-backend | sed 's/%//')
    if (( $(echo "$cpu_usage < 80" | bc -l) )); then
        success "CPU usage is acceptable: ${cpu_usage}%"
    else
        warn "CPU usage is high: ${cpu_usage}%"
    fi
}

test_logs() {
    log "📋 Checking recent logs for errors..."
    
    local error_count=$(docker compose logs --tail=50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        success "No recent errors found in logs"
    else
        warn "Found $error_count potential errors in recent logs"
        echo "Recent errors:"
        docker compose logs --tail=50 | grep -i "error\|exception\|failed" | tail -5
    fi
}

test_disk_space() {
    log "💾 Checking disk space..."
    
    local disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        success "Disk usage is acceptable: ${disk_usage}%"
    else
        warn "Disk usage is high: ${disk_usage}%"
    fi
}

test_network_connectivity() {
    log "🌐 Testing network connectivity..."
    
    if docker exec familexyz-backend curl -f -s --max-time 10 https://api.openai.com > /dev/null; then
        success "External network connectivity is working"
    else
        warn "External network connectivity may have issues"
    fi
}

run_all_tests() {
    log "🚀 Starting FamilyXYZ deployment tests..."
    echo ""
    
    local failed_tests=0
    
    # Test Docker status
    if ! test_docker_status; then
        ((failed_tests++))
    fi
    echo ""
    
    # Test health endpoint
    if ! test_health_endpoint; then
        ((failed_tests++))
    fi
    echo ""
    
    # Test main endpoint
    test_main_endpoint
    echo ""
    
    # Test resource usage
    test_resource_usage
    echo ""
    
    # Test logs
    test_logs
    echo ""
    
    # Test disk space
    test_disk_space
    echo ""
    
    # Test network connectivity
    test_network_connectivity
    echo ""
    
    # Summary
    if [ "$failed_tests" -eq 0 ]; then
        success "🎉 All critical tests passed! Deployment is healthy."
        return 0
    else
        error "❌ $failed_tests critical tests failed. Please check the issues above."
        return 1
    fi
}

# Show usage if no arguments and not in /opt/familexyz
show_usage() {
    echo "Usage: $0 [server_host] [server_port] [health_port]"
    echo ""
    echo "Examples:"
    echo "  $0                          # Test localhost:3000"
    echo "  $0 your-server.com          # Test your-server.com:3000"
    echo "  $0 192.168.1.100 3000 3001 # Test specific host and ports"
    echo ""
    echo "This script tests the FamilyXYZ Docker deployment to ensure:"
    echo "  - Docker containers are running"
    echo "  - Health endpoint is responding"
    echo "  - Resource usage is acceptable"
    echo "  - No critical errors in logs"
    echo "  - Sufficient disk space"
    echo "  - Network connectivity"
}

# Main execution
if [ "$#" -eq 0 ] && [ ! -f "docker-compose.yml" ]; then
    show_usage
    exit 1
fi

# Change to deployment directory if it exists
if [ -d "/opt/familexyz" ] && [ -f "/opt/familexyz/docker-compose.yml" ]; then
    cd /opt/familexyz
fi

# Run tests
run_all_tests
