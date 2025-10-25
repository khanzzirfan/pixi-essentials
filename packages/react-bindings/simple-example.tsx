import React, { useState, useRef, useEffect } from "react";
import { Application, Graphics, Container } from "@pixi/react";
import { Transformer } from "./src/Transformer";
import { DisplayObject } from "@pixi/display";

/**
 * Simple React example showing nested selection with state management
 */

const SimpleNestedSelectionExample: React.FC = () => {
  // State for managing the transformer group
  const [transformerGroup, setTransformerGroup] = useState<DisplayObject[]>([]);
  const [focusedElementIndex, setFocusedElementIndex] = useState<number>(0);
  const [focusedElement, setFocusedElement] = useState<DisplayObject | null>(
    null
  );

  // Refs for shape containers
  const shapeRefs = useRef<{ [key: string]: Container | null }>({});

  // Update transformer group when component mounts
  useEffect(() => {
    const group = Object.values(shapeRefs.current).filter(
      Boolean
    ) as DisplayObject[];
    setTransformerGroup(group);

    // Set initial focus
    if (group.length > 0) {
      setFocusedElement(group[0]);
    }
  }, []);

  // Handle focus change events
  const handleElementFocused = (element: DisplayObject, index: number) => {
    console.log("Element focused:", element, "at index:", index);
    setFocusedElementIndex(index);
    setFocusedElement(element);
  };

  const handleElementFocusCleared = () => {
    console.log("Focus cleared");
    setFocusedElementIndex(-1);
    setFocusedElement(null);
  };

  const handleFocusChange = (index: number, element: DisplayObject | null) => {
    console.log("Focus changed:", { index, element });
    setFocusedElementIndex(index);
    setFocusedElement(element);
  };

  // Programmatic focus control
  const focusElement = (index: number) => {
    if (index >= 0 && index < transformerGroup.length) {
      setFocusedElementIndex(index);
    }
  };

  const cycleNext = () => {
    const nextIndex = (focusedElementIndex + 1) % transformerGroup.length;
    setFocusedElementIndex(nextIndex);
  };

  const clearFocus = () => {
    setFocusedElementIndex(-1);
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
          Nested Selection Demo
        </h3>

        {/* Focus Controls */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <label>Focus:</label>
          {["Circle", "Star", "Rectangle", "Triangle"].map((label, index) => (
            <button
              key={label}
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
              {label}
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <button onClick={cycleNext} style={{ padding: "5px 10px" }}>
            Next
          </button>
          <button onClick={clearFocus} style={{ padding: "5px 10px" }}>
            Clear
          </button>
        </div>

        {/* Status Display */}
        <div style={{ marginLeft: "auto", fontSize: "14px", color: "#666" }}>
          Focused:{" "}
          {focusedElementIndex >= 0
            ? ["Circle", "Star", "Rectangle", "Triangle"][focusedElementIndex]
            : "None"}{" "}
          ({focusedElementIndex})
        </div>
      </div>

      {/* PixiJS Application */}
      <div style={{ flex: 1, position: "relative" }}>
        <Application width={1024} height={768} backgroundColor={0x222222}>
          {/* Green Circle */}
          <Container
            ref={(ref) => {
              shapeRefs.current["circle"] = ref;
            }}
            x={200}
            y={200}
            interactive={true}
            eventMode="static"
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

          {/* Orange Star */}
          <Container
            ref={(ref) => {
              shapeRefs.current["star"] = ref;
            }}
            x={400}
            y={200}
            interactive={true}
            eventMode="static"
          >
            <Graphics
              draw={(g) => {
                g.clear();
                g.beginFill(0xff8800);
                g.drawStar(0, 0, 5, 50, 25);
                g.endFill();
              }}
            />
          </Container>

          {/* Red Rectangle */}
          <Container
            ref={(ref) => {
              shapeRefs.current["rect"] = ref;
            }}
            x={200}
            y={400}
            interactive={true}
            eventMode="static"
          >
            <Graphics
              draw={(g) => {
                g.clear();
                g.beginFill(0xff0000);
                g.drawRect(-50, -50, 100, 100);
                g.endFill();
              }}
            />
          </Container>

          {/* Purple Triangle */}
          <Container
            ref={(ref) => {
              shapeRefs.current["triangle"] = ref;
            }}
            x={400}
            y={400}
            interactive={true}
            eventMode="static"
          >
            <Graphics
              draw={(g) => {
                g.clear();
                g.beginFill(0x8800ff);
                g.drawPolygon([-50, 50, 50, 50, 0, -50]);
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
            focusedElementBorderColor={0x8b5cf6} // Purple for focused element
            focusedElementBorderThickness={2}
            showNonFocusedBorders={false} // Hide non-focused borders
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
        <h4>How to Use:</h4>
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
            <strong>Transform the group</strong> using the handles around the
            selection
          </li>
        </ul>
        <p>
          <strong>Current State:</strong> Focused element:{" "}
          {focusedElementIndex >= 0
            ? ["Circle", "Star", "Rectangle", "Triangle"][focusedElementIndex]
            : "None"}
        </p>
      </div>
    </div>
  );
};

export default SimpleNestedSelectionExample;
