#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# GAMMA DEPLOYMENT - DOUBLE-CLICK LAUNCHER (Linux/Mac)
# ═══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         GAMMA DEPLOYMENT SYSTEM - QUICK LAUNCHER             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

# Set paths
SOURCE_PATH="$(cd "$(dirname "$0")" && pwd)"
TARGET_PATH="/opt/gamma"

# Check for sudo if targeting /opt
if [[ "$TARGET_PATH" == /opt/* ]]; then
    echo "[INFO] Target requires sudo privileges"
    sudo -v || exit 1
fi

# Compile and run
echo "[1/3] Compiling deployment script..."
npx ts-node "$SOURCE_PATH/gamma-deploy.ts" "96-01-07-0443" "$SOURCE_PATH/.." "$TARGET_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "📍 Location: $TARGET_PATH"
    echo ""
    
    # Open folder (platform-specific)
    if command -v xdg-open &> /dev/null; then
        xdg-open "$TARGET_PATH"
    elif command -v open &> /dev/null; then
        open "$TARGET_PATH"
    fi
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Check the error messages above."
fi
