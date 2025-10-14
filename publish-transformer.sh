#!/bin/bash

# Script to publish pixi-essentials-transformer-extended package
# Modern Canva-style transformer for PixiJS

set -e  # Exit on error

echo "🚀 Publishing pixi-essentials-transformer-extended package..."
echo ""

# Navigate to transformer package
cd packages/transformer

echo "📦 Building transformer package..."
npm run build
echo "✅ Build complete!"
echo ""

echo "📋 Package info:"
npm version
echo ""

# Prompt for confirmation
read -p "Do you want to publish to npm? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📤 Publishing to npm..."
    npm publish
    echo ""
    echo "✅ Package published successfully!"
    echo ""
    echo "🎉 Your modern Canva-style transformer is now live on npm!"
else
    echo "❌ Publish cancelled."
fi

cd ../..

