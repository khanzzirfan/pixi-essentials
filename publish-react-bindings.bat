@echo off
REM Script to publish pixi-essentials-react-bindings-extended package
REM React bindings for modern Canva-style transformer for PixiJS
echo 🚀 Publishing pixi-essentials-react-bindings-extended package...
echo.
REM Navigate to react-bindings package
cd packages\react-bindings
REM Build the package
call npm run build
REM Publish to npm
npm publish
echo.
echo ✅ pixi-essentials-react-bindings-extended published successfully!
