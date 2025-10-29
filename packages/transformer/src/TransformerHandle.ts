import { Graphics } from "@pixi/graphics";
import { Point } from "@pixi/math";
import { Renderer, Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";

import type { Container } from "@pixi/display";
import type { Handle, Transformer } from "./Transformer";
import {
  FederatedEventTarget,
  FederatedPointerEvent,
  IFederatedDisplayObject,
} from "@pixi/events";

/** @see TransformerHandle#style */
export interface ITransformerHandleStyle {
  /** Fill color of the handle */
  color: number;

  /** Outline color of the handle */
  outlineColor: number;

  /** Outline thickness around the handle */
  outlineThickness: number;

  /** Radius (or size for non-circular handles) of the handle */
  radius: number;

  /** {@link TransformerHandle} provides three types of handle shapes - 'circle', 'square', 'tooth'. */
  shape: string;

  /** Glow color for the handle */
  glowColor?: number;

  /** Glow intensity for the handle */
  glowIntensity?: number;

  /** Optional explicit color for the rotator SVG icon (overrides outlineColor) */
  rotatorIconColor?: number;
}

/**
 * The default transformer handle style.
 *
 * @ignore
 */
const DEFAULT_HANDLE_STYLE: ITransformerHandleStyle = {
  color: 0xffffff,
  outlineColor: 0x6366f1,
  outlineThickness: 2.5,
  radius: 7,
  shape: "circle",
  glowColor: 0x6366f1,
  glowIntensity: 0.15,
};

const Graphics_ = Graphics as unknown as {
  new (): Graphics & FederatedEventTarget;
};

/**
 * Create rotator SVG as a data URL - scalable version that adapts to handle size
 */
function createRotatorSVG(
  backgroundColor: string = "#00BCD4",
  arrowColor: string = "#FFFFFF",
  size: number = 28
): string {
  // Scale the SVG based on handle size, but keep it proportional
  const scale = Math.max(1, size / 28); // Minimum scale of 1
  const svgSize = Math.round(24 * scale); // Base size is 24, scale it

  return `data:image/svg+xml;base64,${btoa(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="none">
  <!-- circular cyan background -->
  <circle cx="12" cy="12" r="10" fill="${backgroundColor}"/>

  <!-- white arrow paths -->
  <path fill-rule="evenodd" clip-rule="evenodd"
    d="M5.46056 11.0833C5.83331 7.79988 8.62404 5.25 12.0096 5.25C14.148 5.25 16.0489 6.26793 17.2521 7.84246C17.5036 8.17158 17.4406 8.64227 17.1115 8.89376C16.7824 9.14526 16.3117 9.08233 16.0602 8.7532C15.1289 7.53445 13.6613 6.75 12.0096 6.75C9.45213 6.75 7.33639 8.63219 6.9733 11.0833H7.33652C7.63996 11.0833 7.9135 11.2662 8.02953 11.5466C8.14556 11.8269 8.0812 12.1496 7.86649 12.364L6.69823 13.5307C6.40542 13.8231 5.9311 13.8231 5.63829 13.5307L4.47003 12.364C4.25532 12.1496 4.19097 11.8269 4.30699 11.5466C4.42302 11.2662 4.69656 11.0833 5 11.0833H5.46056Z"
    fill="${arrowColor}"/>

  <path fill-rule="evenodd" clip-rule="evenodd"
    d="M18.3617 10.4693C18.0689 10.1769 17.5946 10.1769 17.3018 10.4693L16.1335 11.636C15.9188 11.8504 15.8545 12.1731 15.9705 12.4534C16.0865 12.7338 16.3601 12.9167 16.6635 12.9167H17.0267C16.6636 15.3678 14.5479 17.25 11.9905 17.25C10.3464 17.25 8.88484 16.4729 7.9529 15.2638C7.70002 14.9358 7.22908 14.8748 6.90101 15.1277C6.57295 15.3806 6.512 15.8515 6.76487 16.1796C7.96886 17.7416 9.86205 18.75 11.9905 18.75C15.376 18.75 18.1667 16.2001 18.5395 12.9167H19C19.3035 12.9167 19.577 12.7338 19.693 12.4534C19.8091 12.1731 19.7447 11.8504 19.53 11.636L18.3617 10.4693Z"
    fill="${arrowColor}"/>
</svg>
  `.trim()
  )}`;
}

/**
 * The transfomer handle base implementation.
 *
 * @extends PIXI.Graphics
 */
export class TransformerHandle extends Graphics_ {
  onHandleDelta: (pointerPosition: Point) => void;
  onHandleCommit: () => void;

  protected _handle: Handle;
  protected _style: ITransformerHandleStyle;
  protected _dirty: boolean;

  private _pointerDown: boolean;
  private _pointerDragging: boolean;
  private _pointerPosition: Point;
  private _pointerMoveTarget: (Container & IFederatedDisplayObject) | null;
  private _rotatorSprite: Sprite | null = null;
  private _rotatorKey: string | null = null;

  // Cache for rotator textures to avoid jank on re-creation
  private static _rotatorTextureCache: Map<string, Texture> = new Map();

  /**
   * @param {Transformer} transformer
   * @param {string} handle - the type of handle being drawn
   * @param {object} styleOpts - styling options passed by the user
   * @param {function} handler - handler for drag events, it receives the pointer position; used by {@code onDrag}.
   * @param {function} commit - handler for drag-end events.
   * @param {string}[cursor='move'] - a custom cursor to be applied on this handle
   */
  constructor(
    protected readonly transformer: Transformer,
    handle: Handle,
    styleOpts: Partial<ITransformerHandleStyle> = {},
    handler: (pointerPosition: Point) => void,
    commit: () => void,
    cursor?: string
  ) {
    super();

    const style: ITransformerHandleStyle = Object.assign(
      {},
      DEFAULT_HANDLE_STYLE,
      styleOpts
    );

    this._handle = handle;
    this._style = style;
    this.onHandleDelta = handler;
    this.onHandleCommit = commit;

    /**
     * This flags whether this handle should be redrawn in the next frame due to style changes.
     */
    this._dirty = true;

    // Pointer events
    this.interactive = true;
    this.cursor = cursor || "move";
    this._pointerDown = false;
    this._pointerDragging = false;
    this._pointerPosition = new Point();
    this._pointerMoveTarget = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.onpointerdown = this.onPointerDown;
    this.onpointermove = this.onPointerMove;
    this.onpointerup = this.onPointerUp;
    this.onpointerupoutside = this.onPointerUp;
  }

  get handle(): Handle {
    return this._handle;
  }
  set handle(handle: Handle) {
    this._handle = handle;
    this._dirty = true;
  }

  /**
   * The currently applied handle style.
   */
  get style(): Partial<ITransformerHandleStyle> {
    return this._style;
  }
  set style(value: Partial<ITransformerHandleStyle>) {
    this._style = Object.assign({}, DEFAULT_HANDLE_STYLE, value);
    this._dirty = true;
  }

  render(renderer: Renderer): void {
    if (this._dirty) {
      this.draw();

      this._dirty = false;
    }

    super.render(renderer);
  }

  /**
   * Redraws the handle's geometry. This is called on a `render` if {@code this._dirty} is true.
   */
  protected draw(): void {
    const handle = this._handle;
    const style = this._style;

    this.clear();

    // Check handle type for different shapes
    const isMiddleHandle = handle === "middleLeft" || handle === "middleRight";
    const isTopBottomHandle =
      handle === "topCenter" || handle === "bottomCenter";
    const isRotator = handle === "rotator";

    // Draw glow effect if enabled
    if (
      style.glowColor &&
      style.glowIntensity &&
      style.glowIntensity > 0 &&
      !isRotator
    ) {
      this.drawGlowEffect(style, isMiddleHandle || isTopBottomHandle);
    }

    // Draw handle based on type
    if (isRotator) {
      this.drawRotatorHandle(style);
    } else if (isMiddleHandle || isTopBottomHandle) {
      this.drawPillHandle(handle, style);
    } else {
      this.drawCornerHandle(style);
    }
  }

  /**
   * Draws glow effect for handles
   */
  private drawGlowEffect(
    style: ITransformerHandleStyle,
    isPill: boolean
  ): void {
    const glowSteps = 3;
    const baseRadius = style.radius || 7;
    const scaleFactor = baseRadius / 7; // Scale relative to default 7px radius

    if (isPill) {
      // Scale pill dimensions based on handle radius
      const width = 10 * scaleFactor;
      const height = 20 * scaleFactor;
      const radius = 5 * scaleFactor;
      const glowOffset = 2 * scaleFactor;

      for (let i = 0; i < glowSteps; i++) {
        const alpha = (style.glowIntensity || 0.15) * (1 - i / glowSteps) * 0.3;
        const offset = i * glowOffset;

        this.beginFill(style.glowColor || 0x6366f1, alpha)
          .drawRoundedRect(
            -width / 2 - offset,
            -height / 2 - offset,
            width + offset * 2,
            height + offset * 2,
            radius + offset
          )
          .endFill();
      }
    } else {
      const glowRadius = baseRadius * 1.5;

      for (let i = 0; i < glowSteps; i++) {
        const alpha = (style.glowIntensity || 0.15) * (1 - i / glowSteps) * 0.3;
        const currentRadius =
          baseRadius + (glowRadius - baseRadius) * (i / glowSteps);

        this.beginFill(style.glowColor || 0x6366f1, alpha)
          .drawCircle(0, 0, currentRadius)
          .endFill();
      }
    }
  }

  /**
   * Draws corner handle (circle)
   */
  private drawCornerHandle(style: ITransformerHandleStyle): void {
    const radius = style.radius || 7;

    // Draw white circle
    this.beginFill(0xffffff).drawCircle(0, 0, radius).endFill();

    // Draw colored border
    this.lineStyle(
      style.outlineThickness || 2.5,
      style.outlineColor || 0x6366f1
    ).drawCircle(0, 0, radius);
  }

  /**
   * Draws pill-shaped handle for middle handles
   */
  private drawPillHandle(handle: Handle, style: ITransformerHandleStyle): void {
    const baseRadius = style.radius || 7;
    const scaleFactor = baseRadius / 7; // Scale relative to default 7px radius

    const isVertical = handle === "topCenter" || handle === "bottomCenter";
    const width = (isVertical ? 20 : 10) * scaleFactor;
    const height = (isVertical ? 10 : 20) * scaleFactor;
    const radius = 5 * scaleFactor;

    // Draw white rounded rectangle
    this.beginFill(style.color || 0xffffff)
      .drawRoundedRect(-width / 2, -height / 2, width, height, radius)
      .endFill();

    // Draw colored border
    this.lineStyle(
      style.outlineThickness || 2.5,
      style.outlineColor || 0x6366f1
    ).drawRoundedRect(-width / 2, -height / 2, width, height, radius);
  }

  /**
   * Draws rotator handle using SVG sprite
   */
  private drawRotatorHandle(style: ITransformerHandleStyle): void {
    // Determine icon color (explicit override > outlineColor > default)
    const iconColor = style.outlineColor || 0x6366f1;
    const colorHex = "#" + iconColor.toString(16).padStart(6, "0");

    const rotatorArrowColorHex = style.rotatorIconColor
      ? "#" + style.rotatorIconColor.toString(16).padStart(6, "0")
      : "#FFFFFF";

    // Calculate sprite size based on handle radius
    const baseRadius = style.radius || 7;
    const scaleFactor = baseRadius / 7; // Scale relative to default 7px radius
    const spriteSize = Math.round(28 * scaleFactor); // Scale the 28px base size
    const key = `${colorHex}:${rotatorArrowColorHex}:${spriteSize}`;

    // Get or create cached texture
    let texture = TransformerHandle._rotatorTextureCache.get(key);
    if (!texture) {
      const svgDataUrl = createRotatorSVG(
        colorHex,
        rotatorArrowColorHex,
        spriteSize
      );
      texture = Texture.from(svgDataUrl);
      TransformerHandle._rotatorTextureCache.set(key, texture);
    }

    // Update sprite only if key changed or sprite doesn't exist
    if (this._rotatorKey !== key || !this._rotatorSprite) {
      // Remove old sprite if exists
      if (this._rotatorSprite) {
        this.removeChild(this._rotatorSprite);
        this._rotatorSprite.destroy();
        this._rotatorSprite = null;
      }

      // Create new sprite with cached texture
      this._rotatorSprite = new Sprite(texture);
      this._rotatorSprite.anchor.set(0.5, 0.5);
      this._rotatorSprite.width = spriteSize;
      this._rotatorSprite.height = spriteSize;
      this.addChild(this._rotatorSprite);
      this._rotatorKey = key;
    } else {
      // Just update size in case radius changed
      this._rotatorSprite.width = spriteSize;
      this._rotatorSprite.height = spriteSize;
    }
  }

  /**
   * Handles the `pointerdown` event. You must call the super implementation.
   *
   * @param e
   */
  protected onPointerDown(e: FederatedPointerEvent): void {
    this._pointerDown = true;
    this._pointerDragging = false;

    e.stopPropagation();

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.removeEventListener(
        "globalpointermove",
        this.onPointerMove
      );
      this._pointerMoveTarget = null;
    }

    this._pointerMoveTarget = (this.transformer.stage ||
      this) as unknown as Container & IFederatedDisplayObject;
    this._pointerMoveTarget.addEventListener(
      "globalpointermove",
      this.onPointerMove
    );
  }

  /**
   * Handles the `pointermove` event. You must call the super implementation.
   *
   * @param e
   */
  protected onPointerMove(e: FederatedPointerEvent): void {
    if (!this._pointerDown) {
      return;
    }

    if (this._pointerDragging) {
      this.onDrag(e);
    } else {
      this.onDragStart(e);
    }

    e.stopPropagation();
  }

  /**
   * Handles the `pointerup` and `pointerupoutside` events. You must call the super implementation.
   *
   * @param e
   */
  protected onPointerUp(e: FederatedPointerEvent): void {
    if (this._pointerDragging) {
      this.onDragEnd(e);
    }

    this._pointerDown = false;

    if (this._pointerMoveTarget) {
      this._pointerMoveTarget.removeEventListener(
        "globalpointermove",
        this.onPointerMove
      );
      this._pointerMoveTarget = null;
    }
  }

  /**
   * Called on the first `pointermove` when {@code this._pointerDown} is true. You must call the super implementation.
   *
   * @param e
   */
  protected onDragStart(e: FederatedPointerEvent): void {
    this._pointerPosition.copyFrom(e.data.global);

    this._pointerDragging = true;
  }

  /**
   * Called on a `pointermove` when {@code this._pointerDown} & {@code this._pointerDragging}.
   *
   * @param e
   */
  protected onDrag(e: FederatedPointerEvent): void {
    const currentPosition = e.data.global;

    // Callback handles the rest!
    if (this.onHandleDelta) {
      this.onHandleDelta(currentPosition);
    }

    this._pointerPosition.copyFrom(currentPosition);
  }

  /**
   * Called on a `pointerup` or `pointerupoutside` & {@code this._pointerDragging} was true.
   *
   * @param _
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onDragEnd(_: FederatedPointerEvent): void {
    this._pointerDragging = false;

    if (this.onHandleCommit) {
      this.onHandleCommit();
    }
  }
}
