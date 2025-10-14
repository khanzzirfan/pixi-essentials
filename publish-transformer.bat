@echo off
REM Script to publish pixi-essentials-transformer-extended package
REM Modern Canva-style transformer for PixiJS

echo 🚀 Publishing pixi-essentials-transformer-extended package...
echo.

REM Navigate to transformer package
cd packages\transformer

echo 📦 Building transformer package...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    cd ..\..
    exit /b 1
)
echo ✅ Build complete!
echo.

echo 📋 Package info:
call npm version
echo.

REM Prompt for confirmation
set /p CONFIRM="Do you want to publish to npm? (y/N): "
if /i "%CONFIRM%"=="y" (
    echo 📤 Publishing to npm...
    call npm publish
    if errorlevel 1 (
        echo ❌ Publish failed!
        cd ..\..
        exit /b 1
    )
    echo.
    echo ✅ Package published successfully!
    echo.
    echo 🎉 Your modern Canva-style transformer is now live on npm!
) else (
    echo ❌ Publish cancelled.
)

cd ..\..

