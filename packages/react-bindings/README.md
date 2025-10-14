# pixi-essentials-react-bindings-extended

React components for the modern Canva-style transformer, designed for usage with [@pixi/react](https://github.com/pixijs/pixi-react).

This package provides React bindings for `pixi-essentials-transformer-extended` with full support for modern Canva-style features including configurable rotator anchor lines and dynamic color theming.

## Installation :package:

```bash
npm install pixi-essentials-react-bindings-extended
```

## Dependencies

- `pixi-essentials-transformer-extended ^1.0.4`
- `@pixi/react ^7.0.0`
- `react >=17.0.0`

## Components :page_with_curl:

| Package                              | Display Objects |
| ------------------------------------ | --------------- |
| pixi-essentials-transformer-extended | Transformer     |

## Usage :page_facing_up:

```tsx
import React from "react";
import { Stage } from "@pixi/react";
import { Transformer } from "pixi-essentials-react-bindings-extended";

const MyComponent = () => {
  return (
    <Stage width={1024} height={1024}>
      <Transformer
        group={[sprite1, sprite2]}
        transientGroupTilt={false}
        // Modern Canva-style handle configuration
        handleStyle={{
          radius: 7,
          color: 0xffffff,
          outlineColor: 0x6366f1,
          outlineThickness: 2.5,
          glowColor: 0x6366f1,
          glowIntensity: 0.15,
        }}
        // Color theme system
        colorTheme={{
          primary: 0x6366f1,
          secondary: 0x4f46e5,
          background: 0xffffff,
          glow: 0x6366f1,
          glowIntensity: 0.15,
        }}
        // Rotator anchor configuration
        rotatorAnchor={{
          enabled: true,
          startPosition: 0.45,
          segmentLength: 0.005,
          style: "solid",
          dashPattern: [8, 4],
          dotPattern: [2, 4],
        }}
        // Event handlers
        transformchange={() => console.log("Transform changed")}
        transformcommit={() => console.log("Transform committed")}
      />
    </Stage>
  );
};
```

## Modern Features :sparkles:

### Dynamic Color Theming

```tsx
const [theme, setTheme] = useState({
  primary: 0x6366f1,
  secondary: 0x4f46e5,
  glow: 0x6366f1,
});

// Update theme dynamically
setTheme({
  primary: 0xff6b6b, // Red theme
  secondary: 0xe74c3c,
  glow: 0xff6b6b,
});

<Transformer colorTheme={theme} />;
```

### Configurable Rotator Anchor

```tsx
// Solid line
<Transformer rotatorAnchor={{ style: 'solid' }} />

// Dashed line with custom pattern
<Transformer
  rotatorAnchor={{
    style: 'dashed',
    dashPattern: [10, 5],
    startPosition: 0.5
  }}
/>

// Dotted line with custom dots
<Transformer
  rotatorAnchor={{
    style: 'dotted',
    dotPattern: [3, 6],
    segmentLength: 0.02
  }}
/>

// Disable anchor line
<Transformer rotatorAnchor={{ enabled: false }} />
```

### Advanced Handle Styling

```tsx
<Transformer
  handleStyle={{
    radius: 8,
    color: 0xffffff,
    outlineColor: 0xff6b6b,
    outlineThickness: 3,
    glowColor: 0xff6b6b,
    glowIntensity: 0.2,
  }}
/>
```

### Handle Size Scaling

The transformer intelligently scales all elements when you increase handle sizes:

```tsx
// Example: Large handles with proportional scaling
<Transformer
  handleStyle={{
    radius: 21, // 300% of default 7px
    outlineThickness: 7.5, // Scales proportionally
    glowIntensity: 0.5, // Enhanced for larger handles
  }}
  wireframeStyle={{
    thickness: 6, // Scales with handle size
  }}
  rotatorAnchor={{
    thickness: 6, // Maintains visual balance
    segmentLength: 0.015, // Longer for larger handles
  }}
/>
```

#### What Scales Automatically

| Element                  | Scaling Behavior                                             |
| ------------------------ | ------------------------------------------------------------ |
| **SVG Rotator Icon**     | Scales proportionally with handle radius                     |
| **Pill Handles**         | Width/height scale with radius (maintains aspect ratio)      |
| **Glow Effects**         | Offset and intensity scale with handle size                  |
| **Rotator Distance**     | Position scales to maintain proper spacing from bounding box |
| **Anchor Line Position** | Adjusts start position based on handle size                  |

#### Size Presets Example

```tsx
const [sizePreset, setSizePreset] = useState("medium");

const sizeConfigs = {
  small: {
    handleStyle: { radius: 7, outlineThickness: 2.5, glowIntensity: 0.15 },
    wireframeStyle: { thickness: 2 },
    rotatorAnchor: { thickness: 2, segmentLength: 0.005 },
  },
  medium: {
    handleStyle: { radius: 10, outlineThickness: 3.5, glowIntensity: 0.25 },
    wireframeStyle: { thickness: 3 },
    rotatorAnchor: { thickness: 3, segmentLength: 0.008 },
  },
  large: {
    handleStyle: { radius: 14, outlineThickness: 5, glowIntensity: 0.35 },
    wireframeStyle: { thickness: 4 },
    rotatorAnchor: { thickness: 4, segmentLength: 0.012 },
  },
  xlarge: {
    handleStyle: { radius: 21, outlineThickness: 7.5, glowIntensity: 0.5 },
    wireframeStyle: { thickness: 6 },
    rotatorAnchor: { thickness: 6, segmentLength: 0.015 },
  },
};

<Transformer {...sizeConfigs[sizePreset]} />;
```

## Props Reference :book:

### Transformer Props

| Prop                 | Type                               | Default     | Description                           |
| -------------------- | ---------------------------------- | ----------- | ------------------------------------- |
| `group`              | `DisplayObject[]`                  | `[]`        | Array of display objects to transform |
| `colorTheme`         | `Partial<ITransformerColorTheme>`  | `undefined` | Color theme configuration             |
| `rotatorAnchor`      | `Partial<IRotatorAnchorConfig>`    | `undefined` | Rotator anchor line configuration     |
| `handleStyle`        | `Partial<ITransformerHandleStyle>` | `undefined` | Handle styling options                |
| `wireframeStyle`     | `Partial<ITransformerStyle>`       | `undefined` | Wireframe styling options             |
| `rotateEnabled`      | `boolean`                          | `true`      | Enable rotation handles               |
| `scaleEnabled`       | `boolean`                          | `true`      | Enable scaling handles                |
| `translateEnabled`   | `boolean`                          | `true`      | Enable translation                    |
| `transientGroupTilt` | `boolean`                          | `true`      | Reset rotation after transform        |
| `transformchange`    | `() => void`                       | `undefined` | Called during transform               |
| `transformcommit`    | `() => void`                       | `undefined` | Called after transform                |

### Color Theme Props

| Prop            | Type     | Default    | Description                          |
| --------------- | -------- | ---------- | ------------------------------------ |
| `primary`       | `number` | `0x6366f1` | Main color for handles and wireframe |
| `secondary`     | `number` | `0x4f46e5` | Secondary accent color               |
| `background`    | `number` | `0xffffff` | Handle background color              |
| `glow`          | `number` | `0x6366f1` | Glow effect color                    |
| `glowIntensity` | `number` | `0.15`     | Glow intensity (0-1)                 |

### Rotator Anchor Props

| Prop            | Type                              | Default     | Description                   |
| --------------- | --------------------------------- | ----------- | ----------------------------- |
| `enabled`       | `boolean`                         | `true`      | Show/hide the anchor line     |
| `startPosition` | `number`                          | `0.45`      | Start position (0-1)          |
| `segmentLength` | `number`                          | `0.005`     | Line length (0-1)             |
| `thickness`     | `number`                          | `undefined` | Line thickness                |
| `color`         | `number`                          | `undefined` | Line color (uses theme)       |
| `style`         | `'solid' \| 'dashed' \| 'dotted'` | `'solid'`   | Line style                    |
| `dashPattern`   | `[number, number]`                | `[8, 4]`    | Dash pattern for dashed style |
| `dotPattern`    | `[number, number]`                | `[2, 4]`    | Dot pattern for dotted style  |

## TypeScript Support :typescript:

Full TypeScript definitions are included:

```tsx
import type {
  TransformerProps,
  ITransformerColorTheme,
  IRotatorAnchorConfig,
} from "pixi-essentials-react-bindings-extended";
```

## Credits :heart:

- **Original Author**: Shukant K. Pal <shukantpal@outlook.com>
- **Modern Upgrade**: Irfan Khan (khanzzirfan)
- **Based on**: [@pixi-essentials/transformer](https://www.npmjs.com/package/@pixi-essentials/transformer)
