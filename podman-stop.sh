#!/bin/bash
# Stop WealthNavigator AI Podman containers

set -e

echo "🛑 Stopping WealthNavigator AI containers..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop containers
echo -e "${YELLOW}Stopping containers...${NC}"
podman stop wealthnav-postgres wealthnav-redis 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}"

# Show status
echo ""
echo "Container status:"
podman ps -a --filter "name=wealthnav" --format "  {{.Names}}: {{.Status}}"

echo ""
echo "To start again: ./podman-start.sh"
echo "To remove containers: podman rm wealthnav-postgres wealthnav-redis"
echo "To stop Podman machine: podman machine stop"
