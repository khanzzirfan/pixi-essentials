# React Bindings for PixiJS Transformer with Nested Selection

This package provides React bindings for the PixiJS Transformer with advanced nested selection features inspired by Canva's design tools.

## Features

- ✅ **Nested Selection**: Click individual elements within a group selection
- ✅ **Auto Focus**: First element automatically focused when transformer is created
- ✅ **Click to Maintain**: Click on focused element → keeps it focused (no cycling)
- ✅ **Click to Focus**: Click different element to focus it
- ✅ **Programmatic Control**: Control focus via React state
- ✅ **Event Handling**: React-friendly event callbacks
- ✅ **Custom Styling**: Canva-style purple/cyan color scheme
- ✅ **State Management**: Seamless integration with React hooks

## Installation

```bash
npm install @pixi/react @pixi/display @pixi/graphics
npm install pixi-essentials-transformer-extended
```

## Basic Usage

```tsx
import React, { useState, useRef } from "react";
import { Application, Graphics, Container } from "@pixi/react";
import { Transformer } from "pixi-essentials-transformer-extended";
import { DisplayObject } from "@pixi/display";

const MyComponent: React.FC = () => {
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
    <Application width={800} height={600}>
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

## Advanced Usage with Custom Hook

For easier state management, use the provided `useNestedSelection` hook:

```tsx
import { useNestedSelection } from "./useNestedSelection";

const AdvancedComponent: React.FC = () => {
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

## Props Reference

### Core Props

| Prop            | Type                             | Default | Description                           |
| --------------- | -------------------------------- | ------- | ------------------------------------- |
| `group`         | `DisplayObject[]`                | `[]`    | Array of display objects to transform |
| `boundingBoxes` | `"all" \| "groupOnly" \| "none"` | `"all"` | Which bounding boxes to show          |

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

| Prop                  | Type                                                      | Description                        |
| --------------------- | --------------------------------------------------------- | ---------------------------------- |
| `elementfocused`      | `(element: DisplayObject, index: number) => void`         | Called when an element is focused  |
| `elementfocuscleared` | `() => void`                                              | Called when focus is cleared       |
| `onFocusChange`       | `(index: number, element: DisplayObject \| null) => void` | Called when focus changes          |
| `transformchange`     | `() => void`                                              | Called during transform operations |
| `transformcommit`     | `() => void`                                              | Called when transform is committed |

### Programmatic Control

| Prop                  | Type     | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `focusedElementIndex` | `number` | Control focused element by index (-1 = none focused) |

## Behavior

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

## Keyboard Navigation

You can add keyboard navigation by listening to key events:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      focusNextElement();
    } else if (e.key === "Escape") {
      clearFocus();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [focusNextElement, clearFocus]);
```

## Examples

See the included examples:

- `example-nested-selection.tsx` - Complete example with all features
- `useNestedSelection.ts` - Custom hook for easier state management

## Migration from Basic Transformer

To migrate from the basic transformer to nested selection:

1. Add nested selection props to your `<Transformer>` component
2. Add event handlers for `elementfocused` and `elementfocuscleared`
3. Use `focusedElementIndex` prop for programmatic control
4. Optionally use the `useNestedSelection` hook for easier state management

The nested selection features are backward compatible - existing transformers will work without changes, but won't have the new nested selection behavior unless explicitly enabled.
