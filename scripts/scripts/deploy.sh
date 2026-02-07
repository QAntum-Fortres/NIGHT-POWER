#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# AUTO-SYNC DEPLOYMENT - Double-Click Launcher (Linux/macOS)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage: ./deploy.sh [password]
# If password is not provided, it will prompt for it
#

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║  AUTO-SYNC DEPLOYMENT - QUICK LAUNCHER                                         ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "   Please install Node.js (https://nodejs.org) and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version 18+ recommended (current: $(node -v))${NC}"
fi

# Get password
if [ -n "$1" ]; then
    PASSWORD="$1"
else
    echo -e "${YELLOW}🔐 Enter deployment password:${NC}"
    read -s PASSWORD
    echo ""
fi

# Get source directory
if [ -n "$2" ]; then
    SOURCE_DIR="$2"
else
    SOURCE_DIR="$SCRIPT_DIR/.."
fi

echo -e "${GREEN}🚀 Starting deployment...${NC}"
echo ""

# Run deployment
node "$SCRIPT_DIR/auto-sync-deploy.js" -p "$PASSWORD" -s "$SOURCE_DIR"
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed with exit code: $EXIT_CODE${NC}"
fi

# Keep terminal open on double-click
if [ -z "$1" ]; then
    echo ""
    echo "Press Enter to close..."
    read
fi

exit $EXIT_CODE
