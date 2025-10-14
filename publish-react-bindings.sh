#!/bin/bash
# Script to publish pixi-essentials-react-bindings-extended package
# React bindings for modern Canva-style transformer for PixiJS
set -e  # Exit on error
echo "🚀 Publishing pixi-essentials-react-bindings-extended package..."
echo ""
# Navigate to react-bindings package
cd packages/react-bindings
# Build the package
npm run build
# Publish to npm
npm publish
echo ""
echo "✅ pixi-essentials-react-bindings-extended published successfully!"
