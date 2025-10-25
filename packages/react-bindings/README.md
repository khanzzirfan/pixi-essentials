# pixi-essentials-react-bindings-extended

React components for the modern Canva-style transformer with **nested selection** capabilities, designed for usage with [@pixi/react](https://github.com/pixijs/pixi-react).

This package provides React bindings for `pixi-essentials-transformer-extended` with full support for modern Canva-style features including:

- 🎯 **Nested Selection**: Click individual elements within a group selection (like Canva)
- 🎨 **Dynamic Color Theming**: Configurable color schemes
- 📏 **Configurable Rotator Anchor**: Customizable anchor lines
- 🎛️ **Advanced Handle Styling**: Customizable handle appearance
- ⚡ **React State Integration**: Seamless integration with React hooks and state

## Installation :package:

```bash
npm install pixi-essentials-react-bindings-extended
```

## Dependencies

- `pixi-essentials-transformer-extended ^1.0.9-alpha.6`
- `@pixi/react ^7.0.0`
- `react >=17.0.0`

## Components :page_with_curl:

| Package                              | Display Objects |
| ------------------------------------ | --------------- |
| pixi-essentials-transformer-extended | Transformer     |

## Quick Start :rocket:

### Basic Usage

```tsx
import React, { useState, useRef } from "react";
import { Application, Graphics, Container } from "@pixi/react";
import { Transformer } from "pixi-essentials-react-bindings-extended";
import { DisplayObject } from "@pixi/display";

const MyComponent = () => {
  const [transformerGroup, setTransformerGroup] = useState<DisplayObject[]>([]);
  const [focusedElementIndex, setFocusedElementIndex] = useState<number>(0);
  const shapeRefs = useRef<{ [key: string]: Container | null }>({});

  // Update transformer group when shapes change
  React.useEffect(() => {
    const group = Object.values(shapeRefs.current).filter(
      Boolean
    ) as DisplayObject[];
    setTransformerGroup(group);
  }, []);

  return (
    <Application width={1024} height={1024}>
      {/* Your shapes */}
      <Container
        ref={(ref) => {
          shapeRefs.current["shape1"] = ref;
        }}
      >
        <Graphics
          draw={(g) => {
            g.clear();
            g.beginFill(0x00ff00);
            g.drawCircle(0, 0, 50);
            g.endFill();
          }}
        />
      </Container>

      {/* Transformer with nested selection */}
      <Transformer
        group={transformerGroup}
        boundingBoxes="all"
        // Nested selection configuration
        nestedSelectionEnabled={true}
        focusedElementBorderColor={0x8b5cf6} // Purple for focused
        focusedElementBorderThickness={2}
        showNonFocusedBorders={false}
        individualBorderColor={0x00d4ff} // Cyan for non-focused
        individualBorderThickness={1.5}
        individualBorderAlpha={0.8}
        // Event handlers
        elementfocused={(element, index) => {
          console.log("Element focused:", element, "at index:", index);
          setFocusedElementIndex(index);
        }}
        elementfocuscleared={() => {
          console.log("Focus cleared");
          setFocusedElementIndex(-1);
        }}
        onFocusChange={(index, element) => {
          console.log("Focus changed:", { index, element });
        }}
        // Programmatic control
        focusedElementIndex={focusedElementIndex}
        // Styling
        wireframeStyle={{ color: 0x8b5cf6, thickness: 2 }}
        colorTheme={{ primary: 0x8b5cf6, glow: 0x8b5cf6, glowIntensity: 0.15 }}
      />
    </Application>
  );
};
```

### Advanced Usage with Custom Hook

```tsx
import { useNestedSelection } from "./useNestedSelection";

const AdvancedComponent = () => {
  const [shapes] = useState([
    { id: "circle", x: 200, y: 200 },
    { id: "star", x: 400, y: 200 },
    { id: "rect", x: 200, y: 400 },
  ]);

  const shapeRefs = useRef<{ [key: string]: DisplayObject | null }>({});
  const [transformerGroup, setTransformerGroup] = useState<DisplayObject[]>([]);

  // Use the hook for state management
  const {
    focusedElementIndex,
    focusedElement,
    nestedSelectionEnabled,
    showNonFocusedBorders,
    setNestedSelectionEnabled,
    setShowNonFocusedBorders,
    focusElement,
    focusNextElement,
    clearFocus,
    transformerProps,
  } = useNestedSelection(transformerGroup, {
    initialFocusIndex: 0,
    enabledByDefault: true,
    onFocusChange: (index, element) => {
      console.log("Focus changed:", { index, element });
    },
  });

  return (
    <div>
      {/* Control Panel */}
      <div style={{ padding: "20px", backgroundColor: "#f0f0f0" }}>
        <h3>Nested Selection Controls</h3>

        {/* Focus Controls */}
        {shapes.map((shape, index) => (
          <button
            key={shape.id}
            onClick={() => focusElement(index)}
            style={{
              backgroundColor:
                focusedElementIndex === index ? "#8b5cf6" : "#e0e0e0",
              color: focusedElementIndex === index ? "white" : "black",
            }}
          >
            Focus {shape.id}
          </button>
        ))}

        {/* Navigation */}
        <button onClick={focusNextElement}>Next</button>
        <button onClick={clearFocus}>Clear Focus</button>

        {/* Settings */}
        <label>
          <input
            type="checkbox"
            checked={nestedSelectionEnabled}
            onChange={(e) => setNestedSelectionEnabled(e.target.checked)}
          />
          Nested Selection
        </label>
      </div>

      {/* PixiJS Application */}
      <Application width={800} height={600}>
        {/* Your shapes */}
        {shapes.map((shape) => (
          <Container
            key={shape.id}
            ref={(ref) => {
              shapeRefs.current[shape.id] = ref;
            }}
          >
            {/* Shape graphics */}
          </Container>
        ))}

        {/* Transformer with hook-provided props */}
        <Transformer
          group={transformerGroup}
          boundingBoxes="all"
          {...transformerProps}
        />
      </Application>
    </div>
  );
};
```

## Nested Selection Features :sparkles:

### What is Nested Selection?

Nested selection allows users to interact with individual elements within a multi-selection group, just like in Canva. When you select multiple objects, you can click on individual elements to focus them, cycle through them, and maintain state.

### Key Behaviors

- ✅ **Auto Focus**: First element is automatically focused when transformer is created
- ✅ **Always Focused**: You cannot unfocus all elements (always one element focused)
- ✅ **Click to Focus**: Click on different element → focuses that element
- ✅ **Click to Maintain**: Click on focused element → keeps it focused (no cycling)
- ✅ **Visual Feedback**: Focused element has purple border, non-focused have cyan borders
- ✅ **State Management**: Seamless integration with React state

### Visual Design

```tsx
<Transformer
  // Nested selection configuration
  nestedSelectionEnabled={true}
  focusedElementBorderColor={0x8b5cf6} // Purple for focused element
  focusedElementBorderThickness={2}
  showNonFocusedBorders={false} // Hide non-focused borders (like Canva)
  individualBorderColor={0x00d4ff} // Cyan for non-focused elements
  individualBorderThickness={1.5}
  individualBorderAlpha={0.8}
  // Main group styling
  wireframeStyle={{ color: 0x8b5cf6, thickness: 2 }} // Purple group border
  colorTheme={{ primary: 0x8b5cf6, glow: 0x8b5cf6, glowIntensity: 0.15 }}
/>
```

### Event Handling

```tsx
<Transformer
  // Event handlers for nested selection
  elementfocused={(element, index) => {
    console.log("Element focused:", element, "at index:", index);
    // Update your state here
  }}
  elementfocuscleared={() => {
    console.log("Focus cleared");
    // Handle focus cleared
  }}
  onFocusChange={(index, element) => {
    console.log("Focus changed:", { index, element });
    // Unified focus change handler
  }}
  // Programmatic control
  focusedElementIndex={focusedElementIndex} // Control focus via React state
/>
```

### Keyboard Navigation

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      focusNextElement(); // Cycle to next element
    } else if (e.key === "Escape") {
      clearFocus(); // Clear focus (though one element will remain focused)
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [focusNextElement, clearFocus]);
```

### Custom Hook for State Management

The `useNestedSelection` hook provides a clean interface for managing nested selection state:

```tsx
import { useNestedSelection } from "./useNestedSelection";

const {
  // State
  focusedElementIndex,
  focusedElement,
  nestedSelectionEnabled,
  showNonFocusedBorders,

  // Actions
  setFocusedElementIndex,
  setNestedSelectionEnabled,
  setShowNonFocusedBorders,

  // Programmatic control
  focusElement,
  focusNextElement,
  focusPreviousElement,
  clearFocus,

  // Transformer props (ready to spread)
  transformerProps,
} = useNestedSelection(transformerGroup, {
  initialFocusIndex: 0,
  enabledByDefault: true,
  onFocusChange: (index, element) => {
    console.log("Focus changed:", { index, element });
  },
});

// Use in your component
<Transformer {...transformerProps} />;
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

### Core Props

| Prop                 | Type                               | Default     | Description                           |
| -------------------- | ---------------------------------- | ----------- | ------------------------------------- |
| `group`              | `DisplayObject[]`                  | `[]`        | Array of display objects to transform |
| `boundingBoxes`      | `"all" \| "groupOnly" \| "none"`   | `"all"`     | Which bounding boxes to show          |
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

### Nested Selection Props

| Prop                            | Type      | Default    | Description                                  |
| ------------------------------- | --------- | ---------- | -------------------------------------------- |
| `nestedSelectionEnabled`        | `boolean` | `true`     | Enable nested selection behavior             |
| `focusedElementBorderColor`     | `number`  | `0x8b5cf6` | Color for focused element border (purple)    |
| `focusedElementBorderThickness` | `number`  | `2`        | Thickness for focused element border         |
| `showNonFocusedBorders`         | `boolean` | `false`    | Show borders for non-focused elements        |
| `individualBorderColor`         | `number`  | `0x00d4ff` | Color for non-focused element borders (cyan) |
| `individualBorderThickness`     | `number`  | `1.5`      | Thickness for non-focused element borders    |
| `individualBorderAlpha`         | `number`  | `0.8`      | Alpha for non-focused element borders        |

### Event Handlers

| Prop                  | Type                                                      | Description                       |
| --------------------- | --------------------------------------------------------- | --------------------------------- |
| `elementfocused`      | `(element: DisplayObject, index: number) => void`         | Called when an element is focused |
| `elementfocuscleared` | `() => void`                                              | Called when focus is cleared      |
| `onFocusChange`       | `(index: number, element: DisplayObject \| null) => void` | Called when focus changes         |

### Programmatic Control

| Prop                  | Type     | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `focusedElementIndex` | `number` | Control focused element by index (-1 = none focused) |

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

## Examples :bulb:

### Complete Example with All Features

See `example-nested-selection.tsx` for a comprehensive example that demonstrates:

- Multiple shapes with different colors
- Interactive control panel
- Programmatic focus control
- Settings toggles
- Real-time status display
- Event logging

### Custom Hook Example

See `useNestedSelection.ts` for a custom hook that provides:

- Clean state management
- Programmatic control methods
- Event handling
- Ready-to-use transformer props

### Migration from Basic Transformer

To migrate from the basic transformer to nested selection:

1. **Add nested selection props** to your `<Transformer>` component
2. **Add event handlers** for `elementfocused` and `elementfocuscleared`
3. **Use `focusedElementIndex` prop** for programmatic control
4. **Optionally use the `useNestedSelection` hook** for easier state management

```tsx
// Before (basic transformer)
<Transformer
  group={transformerGroup}
  boundingBoxes="all"
  wireframeStyle={{ color: 0x6366f1, thickness: 2 }}
/>

// After (with nested selection)
<Transformer
  group={transformerGroup}
  boundingBoxes="all"

  // Add nested selection
  nestedSelectionEnabled={true}
  focusedElementBorderColor={0x8b5cf6}
  focusedElementBorderThickness={2}
  showNonFocusedBorders={false}
  individualBorderColor={0x00d4ff}
  individualBorderThickness={1.5}
  individualBorderAlpha={0.8}

  // Add event handlers
  elementfocused={(element, index) => {
    console.log('Element focused:', element, 'at index:', index);
  }}
  elementfocuscleared={() => {
    console.log('Focus cleared');
  }}
  onFocusChange={(index, element) => {
    console.log('Focus changed:', { index, element });
  }}

  // Add programmatic control
  focusedElementIndex={focusedElementIndex}

  // Keep existing styling
  wireframeStyle={{ color: 0x6366f1, thickness: 2 }}
/>
```

## TypeScript Support :typescript:

Full TypeScript definitions are included:

```tsx
import type {
  TransformerProps,
  ITransformerColorTheme,
  IRotatorAnchorConfig,
} from "pixi-essentials-react-bindings-extended";
```

## Behavior Guide :book:

### Automatic Focus

- When transformer is created with a group, the first element (index 0) is automatically focused
- Focus is maintained - you cannot unfocus all elements (always one element focused)

### Click Behavior

- **Click on focused element**: Keeps the current element focused (no cycling)
- **Click on different element**: Focuses that element
- **Click outside elements**: Continues with normal transformer behavior

### Visual Feedback

- **Focused element**: Purple border (configurable color and thickness)
- **Non-focused elements**: Cyan borders (only shown if `showNonFocusedBorders` is true)
- **Group border**: Purple border around the entire selection

### Keyboard Navigation

- **Tab**: Cycle to next element
- **Escape**: Clear focus (though one element will remain focused)

## Credits :heart:

- **Original Author**: Shukant K. Pal <shukantpal@outlook.com>
- **Modern Upgrade**: Irfan Khan (khanzzirfan)
- **Based on**: [@pixi-essentials/transformer](https://www.npmjs.com/package/@pixi-essentials/transformer)
