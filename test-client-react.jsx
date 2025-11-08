/* eslint-disable curly */
/* eslint-disable consistent-return */
/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
/* eslint-disable no-restricted-syntax */
import React, { useCallback } from "react";
import { Graphics } from "@pixi/react";
import get from "lodash/get";
import { Transformer } from "pixi-essentials-react-bindings-extended";
import { debounce } from "lodash";
import { emitCustomEvent, useCustomEventListener } from "react-custom-events";
import useGuidelines from "../hooks/useGuideLines";
import {
  PLAYEREVENTS,
  TransformerDragType,
  TIMELINE_ITEM_TYPE,
} from "../../constants";

/**
 * Unified Transformer Component
 * Renders a single Transformer that can handle:
 * - Single element selection
 * - Multi-select (multiple elements)
 * - Groups
 */
const PixiUnifiedTransformer = (props) => {
  const {
    spriteHelperRef,
    mouseOverTransformerRef,
    selectedElementIds = [],
    selectedGroupId,
    isMultiSelect = false,
    containerRefsMap = {},
    groupData = {},
    getElementTimeRange,
    handleOnTextEditorOpen,
    getSelectedElementType,
    getSelectedElementFontSize,
    getRotationByElementId,
    selectedElementIdInGroup = null,
  } = props;

  const transformerRef = React.useRef();
  const transformerGroupRef = React.useRef([]);
  const [isTransforming, setIsTransforming] = React.useState(false);
  const callbackTriggeredRef = React.useRef(false);
  const lastClickTimeRef = React.useRef(0);
  // Store preview state to ensure commit matches what user sees
  const previewStateRef = React.useRef({});
  // Track if rotation has been set for current selection to avoid repeated updates
  const rotationSetForSelectionRef = React.useRef(null);
  // Track previous frame to detect changes
  const previousFrameRef = React.useRef(null);

  // Local state for nested selection
  const [focusedElementIndex, setFocusedElementIndex] = React.useState(0);

  const initialSelectionReportedRef = React.useRef(false);

  const DOUBLE_CLICK_INTERVAL = 300;

  // Determine if we're in group mode (multi-select or actual group)
  const isGroupMode = isMultiSelect || !!selectedGroupId;

  // Modern Canva-style color theme - Cyan #4af
  const colorTheme = {
    primary: 0x44aaff, // Cyan color for handles and wireframe
    secondary: 0x3498db, // Slightly darker cyan for accents
    background: 0xffffff, // White background for handles
    glow: 0x44aaff, // Cyan glow effect
    glowIntensity: 0.25, // Balanced glow for visibility
  };

  const parseToDecimal = (value) => parseFloat(Number(value || 0).toFixed(2));

  // Handle element focus within group
  const handleElementFocused = React.useCallback(
    (element, index) => {
      setFocusedElementIndex(index);
      const elementId = selectedElementIds[index];
      // Emit event to update parent component
      emitCustomEvent(PLAYEREVENTS.ELEMENT_IN_GROUP_SELECTED_UNIQUE_ID, {
        uniqueId: elementId,
        groupId: selectedGroupId,
      });
    },
    [selectedElementIds, selectedGroupId]
  );

  /**
   * Determines the type of scaling operation based on container scale values
   * @param {Object} scale - Scale object with x and y properties
   * @returns {'uniform' | 'width' | 'height' | 'none'} - Type of scaling
   */
  const getScalingType = useCallback((scale) => {
    // Use tolerance for floating point precision issues
    const tolerance = 0.001;
    const hasXScale = Math.abs(scale.x - 1) > tolerance;
    const hasYScale = Math.abs(scale.y - 1) > tolerance;

    // Both dimensions changed - check if they're roughly equal (diagonal/corner scaling)
    if (hasXScale && hasYScale) {
      // For true uniform/diagonal scaling, both scales should be similar
      // But we'll treat any case where both changed as uniform for simplicity
      return "uniform"; // Both dimensions (diagonal/corner handles)
    }
    if (hasXScale) return "width"; // Width only (horizontal handles)
    if (hasYScale) return "height"; // Height only (vertical handles)
    return "none"; // No scaling
  }, []);

  /**
   * Finds the PIXI Text and Sprite objects within a container by searching its children recursively
   * @param {Object} container - PIXI Container
   * @param {string} uniqueId - Unique identifier of the element
   * @returns {{textElement: Object|null, backgroundSprite: Object|null}}
   */
  const findTextElements = useCallback((container, uniqueId) => {
    if (!container?.children) {
      return { textElement: null, backgroundSprite: null };
    }

    const textId = `pixitext-${uniqueId}`;
    const bgSpriteId = `pixitextsprite-bg-texture-${uniqueId}`;
    let textElement = null;
    let backgroundSprite = null;

    // Recursive function to search through containers
    const searchContainer = (currentContainer, depth = 0) => {
      if (!currentContainer?.children || depth > 3) return; // Limit depth to avoid infinite loops

      for (const child of currentContainer.children) {
        // Find the Text element by ID (check for both Text and _Text)
        if (
          child.id === textId &&
          (child.constructor.name === "Text" ||
            child.constructor.name === "_Text")
        ) {
          textElement = child;
        }

        // Find the background Sprite by its specific ID
        if (
          child.id === bgSpriteId &&
          (child.constructor.name === "Sprite" ||
            child.constructor.name === "_Sprite")
        ) {
          backgroundSprite = child;
        }

        // If this child is a Container, search recursively
        if (
          (!textElement || !backgroundSprite) &&
          child.constructor.name.includes("Container")
        ) {
          searchContainer(child, depth + 1);
        }

        if (textElement && backgroundSprite) break;
      }
    };

    // Start the recursive search
    searchContainer(container);

    return { textElement, backgroundSprite };
  }, []);

  /**
   * Applies text scaling transformations to a text sprite by directly manipulating PIXI objects
   * @param {Object} params - Parameters for text scaling
   * @param {string} params.uniqueId - Unique identifier of the element
   * @param {Object} params.container - PIXI Container with the text elements
   * @param {number} params.width - Container width
   * @param {Object} params.scale - Scale object with x and y properties
   * @param {number} params.currentFontSize - Current font size
   * @param {number} params.padding - Padding value for text area
   * @param {boolean} params.shouldCommit - Whether to commit (finalize) or just preview
   */
  const applyTextScaling = useCallback(
    ({
      uniqueId,
      container,
      width,
      scale,
      currentFontSize,
      padding = 1,
      shouldCommit = false,
    }) => {
      console.log(`📝 [applyTextScaling] Element: ${uniqueId}`, {
        width,
        scale,
        currentFontSize,
        shouldCommit,
      });

      const { textElement, backgroundSprite } = findTextElements(
        container,
        uniqueId
      );

      if (!textElement) {
        console.log(
          `📝 [applyTextScaling] No text element found for: ${uniqueId}`
        );
        return null;
      }

      const scalingType = getScalingType(scale);
      console.log(`📝 [applyTextScaling] Scaling type: ${scalingType}`);

      if (scalingType === "none") return currentFontSize;

      let finalFontSize = currentFontSize;
      const inverseScaleX = 1 / scale.x;
      const inverseScaleY = 1 / scale.y;

      switch (scalingType) {
        case "uniform": {
          // Uniform/diagonal scaling: scale font size using scale.x only (requested behavior)
          const scaleFactor = scale.x;

          if (shouldCommit) {
            console.log(`📝 [uniform commit] scaleFactor: ${scaleFactor}`);
            // Commit: Use stored preview state to ensure commit matches what user saw
            const previewState = previewStateRef.current[uniqueId];
            if (previewState) {
              finalFontSize = previewState.fontSize;
              textElement.style.fontSize = finalFontSize;
              // CRITICAL: Use preview wordWrapWidth to ensure consistency with what user saw
              textElement.style.wordWrapWidth = previewState.wordWrapWidth;
              console.log(
                `📝 [uniform commit] Using preview state - fontSize: ${finalFontSize}, wordWrapWidth: ${previewState.wordWrapWidth}`
              );
            } else {
              // Fallback: calculate if no preview state stored
              finalFontSize *= scaleFactor;
              textElement.style.fontSize = finalFontSize;
              textElement.style.wordWrapWidth = width - padding * 2;
              console.log(
                `📝 [uniform commit] NO preview state - calculated fontSize: ${finalFontSize}, wordWrapWidth: ${
                  width - padding * 2
                }`
              );
            }
            textElement.scale.set(1, 1);
            // IMPORTANT: Reset background sprite properties
            // React will regenerate the texture with new dimensions when props update from Redux
            if (backgroundSprite) {
              // Get the final container dimensions
              const containerParent = backgroundSprite.parent?.parent;
              if (containerParent) {
                // Set sprite dimensions to match final container (prevents texture stretch)
                backgroundSprite.width = containerParent.width;
                backgroundSprite.height = containerParent.height;
                console.log(
                  `📝 [uniform commit] Background sprite reset - width: ${containerParent.width}, height: ${containerParent.height}`
                );
              }
              // Reset scale so the new texture (when generated by React) isn't stretched
              backgroundSprite.scale.set(1, 1);
            }
            // Clean up preview state after commit
            delete previewStateRef.current[uniqueId];
          } else {
            // Live preview: Change fontSize using scale.x and update wordWrapWidth
            const previewFontSize = currentFontSize * scaleFactor;
            textElement.style.fontSize = previewFontSize;
            textElement.style.wordWrapWidth = width - padding * 2;
            textElement.scale.set(1, 1); // Keep scale at 1 since we're changing fontSize
            console.log(
              `📝 [uniform preview] previewFontSize: ${previewFontSize}, wordWrapWidth: ${
                width - padding * 2
              }`
            );
            if (backgroundSprite) {
              backgroundSprite.scale.set(scale.x, scale.y);
              console.log(
                `📝 [uniform preview] Background sprite scale: [${scale.x}, ${scale.y}]`
              );
            }
            // Store preview state for commit
            previewStateRef.current[uniqueId] = {
              fontSize: previewFontSize,
              width,
              wordWrapWidth: textElement.style.wordWrapWidth,
            };
          }
          textElement.dirty = true;
          textElement.updateText();
          break;
        }

        case "width":
          // Width only - adjust word wrap
          textElement.style.wordWrapWidth = width - padding * 2;
          if (!shouldCommit) {
            // Preview: Use inverse scaling to maintain visual text size
            textElement.scale.set(inverseScaleX, inverseScaleY);
            if (backgroundSprite) {
              backgroundSprite.scale.set(scale.x, scale.y);
            }
          } else {
            // Commit: Reset scales (width will be committed in main handler)
            textElement.scale.set(1, 1);
            if (backgroundSprite) {
              backgroundSprite.scale.set(1, 1);
            }
          }
          textElement.dirty = true;
          textElement.updateText();
          break;

        case "height":
          // Height only - NO font size change, just adjust container height
          // When dragging vertical handles, we only change the box height, not text size
          if (shouldCommit) {
            // Keep the same font size, just reset scales and commit new height
            textElement.scale.set(1, 1);
            if (backgroundSprite) {
              backgroundSprite.scale.set(1, 1);
            }
          } else {
            // Live preview: use inverse scaling to maintain visual appearance
            textElement.scale.set(inverseScaleX, inverseScaleY);
            if (backgroundSprite) {
              backgroundSprite.scale.set(scale.x, scale.y);
            }
          }
          textElement.dirty = true;
          textElement.updateText();
          break;

        default:
          break;
      }

      return finalFontSize;
    },
    [findTextElements, getScalingType, previewStateRef]
  );

  /**
   * Checks if an element is a text type (text or caption)
   * @param {string} uniqueId - Element unique identifier
   * @returns {boolean}
   */
  const isTextType = useCallback(
    (uniqueId) => {
      const elementType = getSelectedElementType(uniqueId);
      return elementType === "text" || elementType === "caption";
    },
    [getSelectedElementType]
  );

  /**
   * Gets the rotation value for the transformer based on selected elements
   * For single element selection, returns the element's rotation
   * For multi-select or groups, returns the rotation of the first selected element
   * For groups, uses the group's rotation if available
   * @returns {number} Rotation value in radians
   */
  const getTransformerRotation = useCallback(() => {
    if (!getRotationByElementId || selectedElementIds.length === 0) {
      return 0;
    }

    // For single element selection
    if (selectedElementIds.length === 1) {
      return getRotationByElementId(selectedElementIds[0]) || 0;
    }
    const firstElementRotation =
      getRotationByElementId(selectedElementIds[0]) || 0;
    return firstElementRotation;
  }, [getRotationByElementId, selectedElementIds]);

  // Determine which container ref to use for guidelines
  const guidelineContainerRef = React.useMemo(() => {
    if (isMultiSelect && selectedElementIds.length > 0) {
      return containerRefsMap[selectedElementIds[0]];
    }
    if (selectedGroupId && groupData[selectedGroupId]?.[0]) {
      return containerRefsMap[groupData[selectedGroupId][0].uniqueId];
    }
    if (selectedElementIds.length === 1) {
      return containerRefsMap[selectedElementIds[0]];
    }
    return { current: null };
  }, [
    isMultiSelect,
    selectedElementIds,
    selectedGroupId,
    groupData,
    containerRefsMap,
  ]);

  const { guidelinesRef, drawGuidelines } = useGuidelines(
    isTransforming,
    guidelineContainerRef,
    spriteHelperRef
  );

  // Debounced attach element ref
  const debouncedAttachElementRef = React.useCallback(
    debounce(() => {
      const { isPlaying } = spriteHelperRef.current;
      if (selectedElementIds.length > 0 && !isPlaying) {
        emitCustomEvent(PLAYEREVENTS.ATTACH_ELEMENT_REF, {
          containerRef: containerRefsMap[selectedElementIds[0]].current,
        });
      }
    }, 100),
    [selectedElementIds, containerRefsMap]
  );

  useCustomEventListener(PLAYEREVENTS.CHECK_AND_ATTACH_ELEMENT_REF, () => {
    debouncedAttachElementRef();
  });

  // Mouse event handlers
  const handleMouseOverTransformer = React.useCallback(() => {
    mouseOverTransformerRef.current = {
      ...mouseOverTransformerRef.current,
      isMouseOver: true,
    };
  }, [mouseOverTransformerRef]);

  const handleOnPointerMoveTransformer = React.useCallback(() => {
    const dragType = transformerRef.current?.transformType;
    mouseOverTransformerRef.current = {
      ...mouseOverTransformerRef.current,
      isDragging: true,
      dragType: TransformerDragType[dragType] || null,
    };
  }, [mouseOverTransformerRef]);

  const handleOnPointerUpTransformer = React.useCallback(() => {
    mouseOverTransformerRef.current = {
      ...mouseOverTransformerRef.current,
      isDragging: false,
      dragType: null,
    };
  }, [mouseOverTransformerRef]);

  const handleMouseOutTransformer = React.useCallback(() => {
    setTimeout(() => {
      mouseOverTransformerRef.current = {
        ...mouseOverTransformerRef.current,
        isDragging: false,
        isMouseOver: !!mouseOverTransformerRef.current?.isDragging,
      };
    }, 100);
  }, [mouseOverTransformerRef]);

  const handleMouseDownTransformer = React.useCallback(
    (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      mouseOverTransformerRef.current = {
        ...mouseOverTransformerRef.current,
        isMouseOver: true,
      };
    },
    [mouseOverTransformerRef]
  );

  const handleOnTransformerClick = React.useCallback(
    (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastClickTimeRef.current < DOUBLE_CLICK_INTERVAL) {
        if (handleOnTextEditorOpen) {
          handleOnTextEditorOpen(selectedElementIds[0]);
          const elementType = getSelectedElementType(selectedElementIds[0]);
          // Double click detected
          if (elementType === TIMELINE_ITEM_TYPE.text) {
            handleOnTextEditorOpen(selectedElementIds[0]);
            emitCustomEvent(PLAYEREVENTS.TEXT_EDITOR_OPEN, {
              uniqueId: selectedElementIds[0],
            });
          }
        }
      }
      lastClickTimeRef.current = now;
    },
    [handleOnTextEditorOpen, selectedElementIds, getSelectedElementType]
  );

  const handleOnTransformChange = React.useCallback(() => {
    setIsTransforming(true);
    const firstSelectedElementId = get(selectedElementIds, "[0]", "");
    const isDragging = mouseOverTransformerRef?.current?.isDragging;

    if (mouseOverTransformerRef?.current && !isDragging) {
      mouseOverTransformerRef.current = {
        ...mouseOverTransformerRef.current,
        isDragging: true,
      };
    }

    emitCustomEvent(PLAYEREVENTS.TRANSFORM_CHANGE_START, {
      uniqueId: firstSelectedElementId,
    });
    drawGuidelines();

    // Handle text element live scaling/word wrapping during transform for ALL elements
    selectedElementIds.forEach((uniqueId) => {
      const container = containerRefsMap[uniqueId]?.current;
      if (!container) return;

      // Check if scale has actually changed (more reliable than dragType)
      const scale = {
        x: parseToDecimal(container.scale.x),
        y: parseToDecimal(container.scale.y),
      };
      const hasScaleChanged = scale.x !== 1 || scale.y !== 1;

      console.log(`🔄 [TransformChange] Element: ${uniqueId}`, {
        scale,
        hasScaleChanged,
        width: container.width,
        height: container.height,
        isText: isTextType(uniqueId),
      });

      // Apply text scaling when scale has changed AND it's a text element
      if (hasScaleChanged && isTextType(uniqueId)) {
        // Get the text inner container (first child of the main container)
        const textInnerContainer = container.children?.[0];
        if (!textInnerContainer) return;

        console.log(
          `🔄 [TransformChange] Applying text scaling preview for: ${uniqueId}`
        );

        applyTextScaling({
          uniqueId,
          container: textInnerContainer,
          width: container.width,
          scale,
          currentFontSize: getSelectedElementFontSize(uniqueId),
          padding: 1, // Default padding value
          shouldCommit: false, // Live preview only
        });
      }
    });
  }, [
    drawGuidelines,
    mouseOverTransformerRef,
    selectedElementIds,
    containerRefsMap,
    isTextType,
    getSelectedElementFontSize,
    applyTextScaling,
  ]);

  const handleOnTransformCommit = React.useCallback(() => {
    setIsTransforming(false);

    if (callbackTriggeredRef.current) {
      return;
    }
    callbackTriggeredRef.current = true;

    if (mouseOverTransformerRef?.current) {
      mouseOverTransformerRef.current = {
        ...mouseOverTransformerRef.current,
        isDragging: false,
      };
    }

    console.log(
      "🔵 [TransformCommit] Starting commit for elements:",
      selectedElementIds
    );
    console.log("🔵 [TransformCommit] isGroupMode:", isGroupMode);

    const transforms = [];
    const elementIds = selectedElementIds;
    // Process each element using simple direct transform reading
    elementIds.forEach((uniqueId) => {
      const containerRef = containerRefsMap[uniqueId];
      if (!containerRef?.current) return;

      const container = containerRef.current;

      console.log(`🟢 [Element: ${uniqueId}] Before commit:`, {
        x: container.x,
        y: container.y,
        width: container.width,
        height: container.height,
        scale: [container.scale.x, container.scale.y],
        rotation: container.rotation,
        isText: isTextType(uniqueId),
      });

      // Read transform directly from the container
      const elementTransform = {
        x: container.x,
        y: container.y,
        width: container.width,
        height: container.height,
        rotation: container.rotation,
        scale: [container.scale.x, container.scale.y],
      };

      // Handle text element font size - use preview ref values if available
      let fontSize = isTextType(uniqueId)
        ? getSelectedElementFontSize(uniqueId)
        : null;

      if (isTextType(uniqueId) && fontSize) {
        const scale = { x: container.scale.x, y: container.scale.y };
        const hasScaleChanged =
          Math.abs(scale.x - 1) > 0.001 || Math.abs(scale.y - 1) > 0.001;

        console.log(`🟡 [Text Scaling] Element: ${uniqueId}`, {
          currentFontSize: fontSize,
          scale,
          hasScaleChanged,
          containerWidth: container.width,
          containerHeight: container.height,
        });

        if (hasScaleChanged) {
          // Check if we have preview state stored
          const previewState = previewStateRef.current[uniqueId];

          console.log(
            `🟡 [Text Scaling] Preview state for ${uniqueId}:`,
            previewState
          );

          if (previewState) {
            // Use preview values directly - what user saw is what they get
            fontSize = previewState.fontSize;
            console.log(
              `🟡 [Text Scaling] Using preview fontSize: ${fontSize}`
            );
          } else {
            // Fallback: use applyTextScaling to commit
            console.log(
              "🟡 [Text Scaling] No preview state, applying text scaling"
            );
            const textInnerContainer = container.children?.[0];
            if (textInnerContainer) {
              const newFontSize = applyTextScaling({
                uniqueId,
                container: textInnerContainer,
                width: container.width,
                scale,
                currentFontSize: fontSize,
                padding: 1,
                shouldCommit: true,
              });
              if (newFontSize) {
                fontSize = newFontSize;
                console.log(
                  `🟡 [Text Scaling] Applied new fontSize: ${fontSize}`
                );
              }
            }
          }

          // Reset the container's scale and update base dimensions
          let finalWidth = container.width;
          const finalHeight = container.height;

          // CRITICAL: If we used preview state, ensure width matches what user saw in preview
          if (previewState && previewState.width) {
            finalWidth = previewState.width;
            console.log(
              `🟡 [Text Scaling] Using preview width: ${finalWidth} (container was: ${container.width})`
            );
          }

          console.log(`🟡 [Text Scaling] Final dimensions:`, {
            finalWidth,
            finalHeight,
            fontSize,
          });

          container.scale.set(1, 1);
          container.width = finalWidth;
          container.height = finalHeight;

          elementTransform.scale = [1, 1];
          elementTransform.width = finalWidth;
          elementTransform.height = finalHeight;
        }
      }

      // Create the final transform object
      const newTransforms = {
        x: parseToDecimal(elementTransform.x),
        y: parseToDecimal(elementTransform.y),
        width: parseToDecimal(elementTransform.width),
        height: parseToDecimal(elementTransform.height),
        rotation: parseToDecimal(elementTransform.rotation),
        scale: [
          parseToDecimal(elementTransform.scale[0]),
          parseToDecimal(elementTransform.scale[1]),
        ],
        ...(isTextType(uniqueId) &&
          fontSize && { fontSize: Math.round(fontSize) }),
      };

      console.log(`✅ [Final Transform] Element: ${uniqueId}`, newTransforms);

      transforms.push({
        uniqueId,
        transformation: newTransforms,
      });

      /*  emitCustomEvent(PLAYEREVENTS.TRANSFORM_CHANGE_END, {
        uniqueId,
        transformation: newTransforms
      }); */
    });

    // Emit transformation complete event
    console.log("🚀 [TransformCommit] Emitting transforms:", transforms);
    emitCustomEvent(PLAYEREVENTS.TRANSFORM_CHANGE_GROUP_END, {
      individualElements: transforms,
    });

    setTimeout(() => {
      callbackTriggeredRef.current = false;
      mouseOverTransformerRef.current = {
        ...mouseOverTransformerRef.current,
        isDragging: false,
      };
    }, 100);
  }, [
    mouseOverTransformerRef,
    getSelectedElementFontSize,
    containerRefsMap,
    selectedElementIds,
    isTextType,
    applyTextScaling,
    isGroupMode,
  ]);

  // Add event listeners
  React.useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    transformer.on("mouseover", handleMouseOverTransformer);
    transformer.on("mouseout", handleMouseOutTransformer);
    transformer.on("mousedown", handleMouseDownTransformer);
    transformer.on("pointermove", handleOnPointerMoveTransformer);
    transformer.on("pointerup", handleOnPointerUpTransformer);
    transformer.on("click", handleOnTransformerClick);

    return () => {
      transformer.off("mouseover", handleMouseOverTransformer);
      transformer.off("mouseout", handleMouseOutTransformer);
      transformer.off("mousedown", handleMouseDownTransformer);
      transformer.off("pointermove", handleOnPointerMoveTransformer);
      transformer.off("pointerup", handleOnPointerUpTransformer);
      transformer.off("click", handleOnTransformerClick);
    };
  }, [
    handleMouseOverTransformer,
    handleMouseOutTransformer,
    handleMouseDownTransformer,
    handleOnPointerMoveTransformer,
    handleOnPointerUpTransformer,
    handleOnTransformerClick,
  ]);

  // Check if within time range
  const isWithinTimeRange = React.useCallback(() => {
    const currentFrame = spriteHelperRef.current?.frame || 0;
    return selectedElementIds.some((id) => {
      const { start, end } = getElementTimeRange?.(id) || {};
      return (
        start !== undefined &&
        end !== undefined &&
        currentFrame >= start &&
        currentFrame <= end
      );
    });
  }, [selectedElementIds, getElementTimeRange, spriteHelperRef]);

  const updateTransformerVisibility = React.useCallback(() => {
    if (isTransforming) {
      return;
    }

    if (
      transformerRef.current &&
      selectedElementIds.length > 0 &&
      isWithinTimeRange()
    ) {
      if (containerRefsMap && containerRefsMap[selectedElementIds[0]]) {
        const validContainers = selectedElementIds
          .map((id) => containerRefsMap[id]?.current)
          .filter((container) => {
            if (!container) return false;
            return container.parent !== null && container.parent !== undefined;
          });

        transformerGroupRef.current = validContainers;
        transformerRef.current.group = transformerGroupRef.current;
        transformerRef.current.visible = validContainers.length > 0;

        // Set rotation only once per selection (on mount/selection change)
        if (validContainers.length > 0) {
          const selectionKey = selectedElementIds.join(",");
          const needsRotationUpdate =
            rotationSetForSelectionRef.current !== selectionKey;

          if (needsRotationUpdate) {
            const transformerRotation = getTransformerRotation();

            // Access the internal groupBounds and update rotation
            if (transformerRef.current.groupBounds) {
              transformerRef.current.groupBounds.rotation = transformerRotation;
            }

            // Force a redraw with the new rotation
            transformerRef.current.lazyDirty = true;

            // Mark that rotation has been set for this selection
            rotationSetForSelectionRef.current = selectionKey;
          }
        }
      }
    } else if (transformerRef.current) {
      transformerGroupRef.current = [];
      transformerRef.current.group = transformerGroupRef.current;
      transformerRef.current.visible = false;
      // Reset rotation tracking when no selection
      rotationSetForSelectionRef.current = null;
    }
  }, [
    selectedElementIds,
    containerRefsMap,
    transformerRef,
    isWithinTimeRange,
    getTransformerRotation,
    isTransforming,
    spriteHelperRef,
  ]);

  // Run visibility update when frame changes (component only mounted when not playing)
  React.useEffect(() => {
    const { frame: currentFrame } = spriteHelperRef.current || {};
    // Detect if frame changed
    const frameChanged = previousFrameRef.current !== currentFrame;
    if (frameChanged) {
      updateTransformerVisibility();
      previousFrameRef.current = currentFrame;
    }
  }, [spriteHelperRef]);

  // Run visibility update when selection changes
  React.useEffect(() => {
    updateTransformerVisibility();
  }, [selectedElementIds, containerRefsMap, updateTransformerVisibility]);

  // Run visibility update when frame changes (component only mounted when not playing)
  React.useEffect(() => {
    const timeInterval = setInterval(() => {
      const { frame: currentFrame } = spriteHelperRef.current || {};
      // Detect if frame changed
      const frameChanged = previousFrameRef.current !== currentFrame;
      if (frameChanged) {
        updateTransformerVisibility();
        previousFrameRef.current = currentFrame;
      }
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [spriteHelperRef, updateTransformerVisibility]);

  // Reset focused element when selection changes
  React.useEffect(() => {
    setFocusedElementIndex(0);
    // Reset the initial selection reported flag when selection changes
    initialSelectionReportedRef.current = false;
  }, [selectedElementIds.join(",")]);

  // Update selected element in group and force transformer refresh
  React.useEffect(() => {
    // Force update transformer to reflect new selection within group
    if (selectedElementIdInGroup) {
      setFocusedElementIndex(-1);
      const timeoutId = setTimeout(() => {
        const newIndex = selectedElementIds.indexOf(selectedElementIdInGroup);
        setFocusedElementIndex(newIndex);
      }, 2);
      return () => clearTimeout(timeoutId);
    }

    // Set initial focused element index to 0
    setFocusedElementIndex(0);

    if (
      !initialSelectionReportedRef.current &&
      selectedElementIds.length > 0 &&
      (isMultiSelect || selectedGroupId)
    ) {
      initialSelectionReportedRef.current = true;
      // Use setTimeout to ensure the state update happens first
      const reportTimeout = setTimeout(() => {
        const elementId = selectedElementIds[0];
        if (elementId) {
          emitCustomEvent(PLAYEREVENTS.ELEMENT_IN_GROUP_SELECTED_UNIQUE_ID, {
            uniqueId: elementId,
            groupId: selectedGroupId,
          });
        }
      }, 2);
      return () => clearTimeout(reportTimeout);
    }
  }, [
    selectedElementIdInGroup,
    selectedElementIds,
    isMultiSelect,
    selectedGroupId,
  ]);

  return (
    <>
      <Graphics ref={guidelinesRef} visible={isTransforming} zIndex={1000} />
      <Transformer
        ref={transformerRef}
        group={transformerGroupRef.current}
        rotateEnabled
        boxRotationEnabled
        transientGroupTilt={!isGroupMode}
        centeredScaling={!isGroupMode}
        boxScalingEnabled={!isGroupMode}
        lockAspectRatio
        scaleEnabled
        {...(isGroupMode && {
          enabledHandles: [
            "topLeft",
            "topRight",
            "bottomLeft",
            "bottomRight",
            "rotator",
          ],
        })}
        // Modern color theme system
        colorTheme={colorTheme}
        // Large Canva-style handle configuration (scaled down 50%)
        handleStyle={{
          radius: 16.5,
          color: 0xffffff,
          outlineColor: 0x44aaff,
          outlineThickness: 5.25,
          glowColor: 0x44aaff,
          glowIntensity: 0.25,
          rotatorIconColor: 0xffffff,
        }}
        // Wireframe styling for visible appearance
        wireframeStyle={{
          thickness: 6, // Increased for better visibility
          color: 0x44aaff,
        }}
        // Configurable rotator anchor
        rotatorAnchor={{
          enabled: true,
          startPosition: 0.45,
          segmentLength: 0.012,
          style: "solid",
          thickness: 6, // Match wireframe thickness
        }}
        // Nested selection for groups
        nestedSelectionEnabled={isGroupMode}
        elementfocused={handleElementFocused}
        focusedElementIndex={isTransforming ? -1 : focusedElementIndex}
        focusedElementBorderColor={0xffffff} // White border for selected nested element
        focusedElementBorderThickness={4} // Increased for better visibility
        transformchange={handleOnTransformChange}
        transformcommit={handleOnTransformCommit}
      />
    </>
  );
};

export default React.memo(PixiUnifiedTransformer);
