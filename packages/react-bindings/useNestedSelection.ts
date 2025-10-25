import { useState, useCallback, useRef, useEffect } from "react";
import { DisplayObject } from "@pixi/display";

/**
 * Custom hook for managing nested selection state in React
 *
 * This hook provides a clean interface for managing transformer focus state
 * and integrates seamlessly with React's state management.
 */

export interface UseNestedSelectionOptions {
  /** Initial focused element index */
  initialFocusIndex?: number;
  /** Whether nested selection is enabled by default */
  enabledByDefault?: boolean;
  /** Callback when focus changes */
  onFocusChange?: (index: number, element: DisplayObject | null) => void;
  /** Callback when element is focused */
  onElementFocused?: (element: DisplayObject, index: number) => void;
  /** Callback when focus is cleared */
  onElementFocusCleared?: () => void;
}

export interface UseNestedSelectionReturn {
  // State
  focusedElementIndex: number;
  focusedElement: DisplayObject | null;
  nestedSelectionEnabled: boolean;
  showNonFocusedBorders: boolean;

  // Actions
  setFocusedElementIndex: (index: number) => void;
  setNestedSelectionEnabled: (enabled: boolean) => void;
  setShowNonFocusedBorders: (show: boolean) => void;

  // Programmatic control
  focusElement: (index: number) => void;
  focusNextElement: () => void;
  focusPreviousElement: () => void;
  clearFocus: () => void;

  // Transformer props
  transformerProps: {
    nestedSelectionEnabled: boolean;
    focusedElementBorderColor: number;
    focusedElementBorderThickness: number;
    showNonFocusedBorders: boolean;
    individualBorderColor: number;
    individualBorderThickness: number;
    individualBorderAlpha: number;
    wireframeStyle: { color: number; thickness: number };
    colorTheme: { primary: number; glow: number; glowIntensity: number };
    elementfocused: (element: DisplayObject, index: number) => void;
    elementfocuscleared: () => void;
    onFocusChange: (index: number, element: DisplayObject | null) => void;
    focusedElementIndex: number;
  };
}

export const useNestedSelection = (
  group: DisplayObject[],
  options: UseNestedSelectionOptions = {}
): UseNestedSelectionReturn => {
  const {
    initialFocusIndex = 0,
    enabledByDefault = true,
    onFocusChange,
    onElementFocused,
    onElementFocusCleared,
  } = options;

  // State
  const [focusedElementIndex, setFocusedElementIndexState] = useState<number>(
    group.length > 0 ? initialFocusIndex : -1
  );
  const [focusedElement, setFocusedElement] = useState<DisplayObject | null>(
    group.length > 0 ? group[initialFocusIndex] || null : null
  );
  const [nestedSelectionEnabled, setNestedSelectionEnabled] =
    useState<boolean>(enabledByDefault);
  const [showNonFocusedBorders, setShowNonFocusedBorders] =
    useState<boolean>(false);

  // Update focused element when index changes
  useEffect(() => {
    if (focusedElementIndex >= 0 && focusedElementIndex < group.length) {
      setFocusedElement(group[focusedElementIndex]);
    } else {
      setFocusedElement(null);
    }
  }, [focusedElementIndex, group]);

  // Handle focus change
  const handleFocusChange = useCallback(
    (index: number, element: DisplayObject | null) => {
      setFocusedElementIndexState(index);
      setFocusedElement(element);
      onFocusChange?.(index, element);
    },
    [onFocusChange]
  );

  // Handle element focused event
  const handleElementFocused = useCallback(
    (element: DisplayObject, index: number) => {
      setFocusedElementIndexState(index);
      setFocusedElement(element);
      onElementFocused?.(element, index);
    },
    [onElementFocused]
  );

  // Handle element focus cleared event
  const handleElementFocusCleared = useCallback(() => {
    setFocusedElementIndexState(-1);
    setFocusedElement(null);
    onElementFocusCleared?.();
  }, [onElementFocusCleared]);

  // Programmatic control methods
  const focusElement = useCallback(
    (index: number) => {
      if (index >= 0 && index < group.length) {
        setFocusedElementIndexState(index);
      }
    },
    [group.length]
  );

  const focusNextElement = useCallback(() => {
    if (group.length === 0) return;
    const nextIndex = (focusedElementIndex + 1) % group.length;
    setFocusedElementIndexState(nextIndex);
  }, [focusedElementIndex, group.length]);

  const focusPreviousElement = useCallback(() => {
    if (group.length === 0) return;
    const prevIndex =
      focusedElementIndex <= 0 ? group.length - 1 : focusedElementIndex - 1;
    setFocusedElementIndexState(prevIndex);
  }, [focusedElementIndex, group.length]);

  const clearFocus = useCallback(() => {
    setFocusedElementIndexState(-1);
  }, []);

  // Transformer props object
  const transformerProps = {
    nestedSelectionEnabled,
    focusedElementBorderColor: 0x8b5cf6, // Purple for focused element
    focusedElementBorderThickness: 2,
    showNonFocusedBorders,
    individualBorderColor: 0x00d4ff, // Cyan for non-focused elements
    individualBorderThickness: 1.5,
    individualBorderAlpha: 0.8,
    wireframeStyle: {
      color: 0x8b5cf6, // Purple group border
      thickness: 2,
    },
    colorTheme: {
      primary: 0x8b5cf6,
      glow: 0x8b5cf6,
      glowIntensity: 0.15,
    },
    elementfocused: handleElementFocused,
    elementfocuscleared: handleElementFocusCleared,
    onFocusChange: handleFocusChange,
    focusedElementIndex,
  };

  return {
    // State
    focusedElementIndex,
    focusedElement,
    nestedSelectionEnabled,
    showNonFocusedBorders,

    // Actions
    setFocusedElementIndex: setFocusedElementIndexState,
    setNestedSelectionEnabled,
    setShowNonFocusedBorders,

    // Programmatic control
    focusElement,
    focusNextElement,
    focusPreviousElement,
    clearFocus,

    // Transformer props
    transformerProps,
  };
};

/**
 * Example usage of the useNestedSelection hook
 */
export const ExampleWithHook: React.FC = () => {
  const [shapes] = useState([
    { id: "shape1", x: 200, y: 200 },
    { id: "shape2", x: 400, y: 200 },
    { id: "shape3", x: 200, y: 400 },
  ]);

  const shapeRefs = useRef<{ [key: string]: DisplayObject | null }>({});
  const [transformerGroup, setTransformerGroup] = useState<DisplayObject[]>([]);

  // Use the hook
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

  // Update transformer group
  useEffect(() => {
    const group = Object.values(shapeRefs.current).filter(
      Boolean
    ) as DisplayObject[];
    setTransformerGroup(group);
  }, [shapes]);

  return (
    <div>
      {/* Control Panel */}
      <div style={{ padding: "20px", backgroundColor: "#f0f0f0" }}>
        <h3>Nested Selection with Hook</h3>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          {shapes.map((shape, index) => (
            <button
              key={shape.id}
              onClick={() => focusElement(index)}
              style={{
                padding: "5px 10px",
                backgroundColor:
                  focusedElementIndex === index ? "#8b5cf6" : "#e0e0e0",
                color: focusedElementIndex === index ? "white" : "black",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Focus {shape.id}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <button onClick={focusNextElement}>Next</button>
          <button onClick={clearFocus}>Clear Focus</button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
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

        <p>
          Focused:{" "}
          {focusedElementIndex >= 0 ? shapes[focusedElementIndex]?.id : "None"}
        </p>
      </div>

      {/* PixiJS Application would go here */}
      <div
        style={{
          height: "400px",
          backgroundColor: "#222",
          color: "white",
          padding: "20px",
        }}
      >
        <p>PixiJS Application with Transformer would be rendered here</p>
        <p>Transformer props: {JSON.stringify(transformerProps, null, 2)}</p>
      </div>
    </div>
  );
};
