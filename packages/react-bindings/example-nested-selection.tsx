import React, { useState, useCallback, useRef } from "react";
import { Application, Graphics, Container } from "@pixi/react";
import { Transformer } from "./src/Transformer";
import { DisplayObject } from "@pixi/display";

/**
 * Example React component demonstrating nested selection (Canva-style)
 *
 * Features:
 * - Individual element focus with purple borders
 * - Click to cycle through elements
 * - Programmatic focus control
 * - State management with React hooks
 * - Event handling for focus changes
 */

interface ShapeData {
  id: string;
  x: number;
  y: number;
  color: number;
  label: string;
}

const ExampleNestedSelection: React.FC = () => {
  // State for managing shapes
  const [shapes, setShapes] = useState<ShapeData[]>([
    { id: "circle", x: 200, y: 200, color: 0x00ff00, label: "Green Circle" },
    { id: "star", x: 400, y: 200, color: 0xff8800, label: "Orange Star" },
    { id: "rect", x: 200, y: 400, color: 0xff0000, label: "Red Rectangle" },
    {
      id: "triangle",
      x: 400,
      y: 400,
      color: 0x8800ff,
      label: "Purple Triangle",
    },
  ]);

  // State for transformer group and focus
  const [transformerGroup, setTransformerGroup] = useState<DisplayObject[]>([]);
  const [focusedElementIndex, setFocusedElementIndex] = useState<number>(0);
  const [focusedElement, setFocusedElement] = useState<DisplayObject | null>(
    null
  );
  const [nestedSelectionEnabled, setNestedSelectionEnabled] =
    useState<boolean>(true);
  const [showNonFocusedBorders, setShowNonFocusedBorders] =
    useState<boolean>(false);

  // Refs for shape containers
  const shapeRefs = useRef<{ [key: string]: Container | null }>({});

  // Handle focus change from transformer
  const handleFocusChange = useCallback(
    (index: number, element: DisplayObject | null) => {
      setFocusedElementIndex(index);
      setFocusedElement(element);
      console.log("Focus changed:", { index, element });
    },
    []
  );

  // Handle individual element focus events
  const handleElementFocused = useCallback(
    (element: DisplayObject, index: number) => {
      console.log("Element focused:", element, "at index:", index);
    },
    []
  );

  const handleElementFocusCleared = useCallback(() => {
    console.log("Element focus cleared");
  }, []);

  // Programmatic focus control
  const focusElement = useCallback(
    (index: number) => {
      if (index >= 0 && index < transformerGroup.length) {
        setFocusedElementIndex(index);
      }
    },
    [transformerGroup.length]
  );

  const cycleNext = useCallback(() => {
    const nextIndex = (focusedElementIndex + 1) % transformerGroup.length;
    setFocusedElementIndex(nextIndex);
  }, [focusedElementIndex, transformerGroup.length]);

  const clearFocus = useCallback(() => {
    setFocusedElementIndex(-1);
  }, []);

  // Update transformer group when shapes change
  React.useEffect(() => {
    const group = Object.values(shapeRefs.current).filter(
      Boolean
    ) as DisplayObject[];
    setTransformerGroup(group);
  }, [shapes]);

  // Create shape components
  const createShape = (shapeData: ShapeData) => {
    const { id, x, y, color, label } = shapeData;

    return (
      <Container
        key={id}
        ref={(ref) => {
          shapeRefs.current[id] = ref;
        }}
        x={x}
        y={y}
        interactive={true}
        eventMode="static"
      >
        {id === "circle" && (
          <Graphics
            draw={(g) => {
              g.clear();
              g.beginFill(color);
              g.drawCircle(0, 0, 50);
              g.endFill();
            }}
          />
        )}
        {id === "star" && (
          <Graphics
            draw={(g) => {
              g.clear();
              g.beginFill(color);
              g.drawStar(0, 0, 5, 50, 25);
              g.endFill();
            }}
          />
        )}
        {id === "rect" && (
          <Graphics
            draw={(g) => {
              g.clear();
              g.beginFill(color);
              g.drawRect(-50, -50, 100, 100);
              g.endFill();
            }}
          />
        )}
        {id === "triangle" && (
          <Graphics
            draw={(g) => {
              g.clear();
              g.beginFill(color);
              g.drawPolygon([-50, 50, 50, 50, 0, -50]);
              g.endFill();
            }}
          />
        )}
      </Container>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Control Panel */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ccc",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, marginRight: "20px" }}>
          Nested Selection Controls
        </h3>

        {/* Focus Controls */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <label>Focus:</label>
          {shapes.map((_, index) => (
            <button
              key={index}
              onClick={() => focusElement(index)}
              style={{
                padding: "5px 10px",
                backgroundColor:
                  focusedElementIndex === index ? "#8b5cf6" : "#e0e0e0",
                color: focusedElementIndex === index ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {shapes[index].label}
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <button onClick={cycleNext} style={{ padding: "5px 10px" }}>
            Cycle Next
          </button>
          <button onClick={clearFocus} style={{ padding: "5px 10px" }}>
            Clear Focus
          </button>
        </div>

        {/* Settings */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label>
            <input
              type="checkbox"
              checked={nestedSelectionEnabled}
              onChange={(e) => setNestedSelectionEnabled(e.target.checked)}
            />
            Nested Selection
          </label>
          <label>
            <input
              type="checkbox"
              checked={showNonFocusedBorders}
              onChange={(e) => setShowNonFocusedBorders(e.target.checked)}
            />
            Show Non-Focused
          </label>
        </div>

        {/* Status Display */}
        <div style={{ marginLeft: "auto", fontSize: "14px", color: "#666" }}>
          Focused:{" "}
          {focusedElementIndex >= 0
            ? shapes[focusedElementIndex]?.label
            : "None"}
          ({focusedElementIndex})
        </div>
      </div>

      {/* PixiJS Application */}
      <div style={{ flex: 1, position: "relative" }}>
        <Application width={1024} height={768} backgroundColor={0x222222}>
          {/* Render all shapes */}
          {shapes.map(createShape)}

          {/* Transformer with nested selection */}
          <Transformer
            group={transformerGroup}
            boundingBoxes="all"
            // Nested selection configuration
            nestedSelectionEnabled={nestedSelectionEnabled}
            focusedElementBorderColor={0x8b5cf6} // Purple for focused element
            focusedElementBorderThickness={2}
            showNonFocusedBorders={showNonFocusedBorders}
            individualBorderColor={0x00d4ff} // Cyan for non-focused elements
            individualBorderThickness={1.5}
            individualBorderAlpha={0.8}
            // Main group styling
            wireframeStyle={{
              color: 0x8b5cf6, // Purple group border
              thickness: 2,
            }}
            colorTheme={{
              primary: 0x8b5cf6,
              glow: 0x8b5cf6,
              glowIntensity: 0.15,
            }}
            // Event handlers
            elementfocused={handleElementFocused}
            elementfocuscleared={handleElementFocusCleared}
            onFocusChange={handleFocusChange}
            focusedElementIndex={focusedElementIndex}
            // Transform events
            transformchange={() => console.log("Transform changed")}
            transformcommit={() => console.log("Transform committed")}
          />
        </Application>
      </div>

      {/* Instructions */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #ccc",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <h4>Instructions:</h4>
        <ul>
          <li>
            <strong>Click on individual shapes</strong> to focus them (purple
            border)
          </li>
          <li>
            <strong>Click on focused shape</strong> to cycle to the next element
          </li>
          <li>
            <strong>Use control buttons</strong> to programmatically control
            focus
          </li>
          <li>
            <strong>Toggle settings</strong> to enable/disable nested selection
          </li>
          <li>
            <strong>Transform the group</strong> using the handles around the
            selection
          </li>
        </ul>
        <p>
          <strong>Current State:</strong> Focused element:{" "}
          {focusedElementIndex >= 0
            ? shapes[focusedElementIndex]?.label
            : "None"}
        </p>
      </div>
    </div>
  );
};

export default ExampleNestedSelection;
