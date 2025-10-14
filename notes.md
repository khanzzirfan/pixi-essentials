## pixi-essentials-transformer-extended

Modern Canva-style transformer for PixiJS - Extended version with beautiful interactive handles.

**Repository:** https://github.com/khanzzirfan/pixi-essentials  
**NPM Package:** `pixi-essentials-transformer-extended` (v1.0.0)

### Changes Made ✅

- ✅ Renamed package to `pixi-essentials-transformer-extended` for independent publishing
- ✅ Updated package.json with author info (Irfan Khan - khanzzirfan)
- ✅ Credited original author (Shukant K. Pal) as contributor
- ✅ Created publish scripts for transformer package only
- ✅ Implemented modern Canva-style handles with:
  - ⭕ Circle handles for corners
  - 💊 Pill-shaped handles for edges
  - 🔄 Custom rotation icon with curved arrows
  - ✨ Subtle glow effects
  - 🎯 Clean indigo wireframe

### Installation

```bash
npm install pixi-essentials-transformer-extended
```

### Publishing to NPM

Run either:

- `npm run publish:transformer` (from root)
- `./publish-transformer.sh` (Linux/Mac)
- `publish-transformer.bat` (Windows)

### Credits

- **Original author:** Shukant K. Pal (https://github.com/SukantPal/pixi-essentials)
- **Modern Canva-style upgrade:** Irfan Khan (https://github.com/khanzzirfan)

### Features

✨ Modern UI inspired by Canva  
🎨 Beautiful pill-shaped edge handles  
⭕ Circular corner handles  
🔄 Custom rotation handle with arrows  
✨ Subtle glow effects  
🎯 Clean, minimal wireframe design

<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pixi-essentials-transformer-extended@1.0.0/dist/transformer.js"></script>
</head>
<body>
    <script>
        // Your transformer will be available globally
        const transformer = new PIXI.Transformer({
            group: [sprite1, sprite2],
            stage: app.stage,
        });
    </script>
</body>
</html>
