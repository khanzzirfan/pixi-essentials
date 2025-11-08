# Potential Issues with `lockAspectRatio: true` vs `false`

## Overview
The `lockAspectRatio` feature in the Transformer maintains aspect ratio when scaling via corner handles. However, there are several potential issues to be aware of.

## Critical Issues

### 1. **Sign Preservation Bug** ⚠️
**Location:** Lines 1767-1789 in `Transformer.ts`

**Problem:**
When aspect ratio is locked, the code compares absolute values (`absSx`, `absSy`) but then assigns the signed values directly. This can cause unexpected flipping.

**Example Scenario:**
- User drags corner handle diagonally
- `sx = -2.0` (flipping horizontally)
- `sy = 1.5` (scaling vertically)
- `absSx (2.0) > absSy (1.5)`, so `sy = sx = -2.0`
- Result: Element flips **both** axes, not just horizontally

**Expected Behavior:** 
- Should preserve the sign of the axis that didn't "win"
- Or use absolute value of the winning axis with the sign of the original axis

**Code Fix Needed:**
```typescript
if (absSx > absSy + threshold) {
  sy = sx > 0 ? absSx : -absSx; // Preserve X's sign
} else if (absSy > absSx + threshold) {
  sx = sy > 0 ? absSy : -absSy; // Preserve Y's sign
}
```

### 2. **Edge Handle Inconsistency** ⚠️
**Location:** Lines 1754-1760

**Problem:**
`lockAspectRatio` only applies to corner handles (`topLeft`, `topRight`, `bottomLeft`, `bottomRight`). Edge handles (`topCenter`, `middleLeft`, etc.) **ignore** the setting.

**User Confusion:**
- User sets `lockAspectRatio: true`
- Expects all scaling to maintain aspect ratio
- Dragging edge handles still allows free distortion
- Inconsistent UX

**Impact:**
- Users might think the feature is broken
- Can accidentally distort elements when they expect uniform scaling

### 3. **Negative Scaling with Minimum Threshold Conflict**
**Location:** Lines 1762-1765, then 1767-1789

**Problem:**
The code enforces a minimum scale of `0.01` **before** aspect ratio locking. This can cause issues:

**Scenario:**
- Element starts at scale `(1, 1)`
- User drags to scale `(0.005, 0.5)` 
- `sx` gets clamped to `0.01` (minimum)
- Aspect ratio locking then sees `sx=0.01, sy=0.5`
- Locks to `sx=0.5, sy=0.5` (unexpected jump!)

**Impact:**
- Sudden jumps in scale when one axis goes below minimum
- Can cause elements to "pop" unexpectedly

### 4. **Averaging Can Cause Sign Loss**
**Location:** Lines 1784-1787

**Problem:**
When values are very close (within threshold), the code averages them:
```typescript
const avg = (sx + sy) / 2;
sx = avg;
sy = avg;
```

**Issue:**
- If `sx = 0.5` and `sy = -0.5`, `avg = 0`
- Element becomes invisible (scale 0)
- Or if `sx = 0.1` and `sy = -0.1`, `avg = 0` → clamped to `0.01`

**Better Approach:**
```typescript
// Use absolute value of average, preserve sign of dominant axis
const absAvg = (absSx + absSy) / 2;
const sign = absSx > absSy ? (sx >= 0 ? 1 : -1) : (sy >= 0 ? 1 : -1);
sx = absAvg * sign;
sy = absAvg * sign;
```

### 5. **Multiple Elements with Different Aspect Ratios**
**Problem:**
When scaling a group with `lockAspectRatio: true`:
- Elements with different original aspect ratios will distort differently
- A square and a rectangle scaled together will have different relative distortions
- The group bounding box maintains aspect ratio, but individual elements may not

**Example:**
- Element A: 100x100 (square, aspect ratio 1:1)
- Element B: 200x100 (rectangle, aspect ratio 2:1)
- Scaling corner handle: both scale uniformly
- But Element B's internal aspect ratio changes more dramatically

### 6. **Threshold Value Too Small for Precision**
**Location:** Line 1775

**Problem:**
The threshold `0.001` might be too small for high-precision scenarios or too large for fine-grained control.

**Issues:**
- High-DPI displays with sub-pixel precision
- Very small elements where 0.001 represents significant change
- Can cause rapid switching between axes during micro-movements

## When `lockAspectRatio: false`

### Issues with Free Scaling:

1. **Accidental Distortion**
   - Users can easily create stretched/squashed elements
   - No guardrails against unintended aspect ratio changes
   - Difficult to restore original proportions

2. **Inconsistent Element Shapes**
   - In multi-element groups, each element can distort differently
   - Group loses visual coherence
   - Hard to maintain design consistency

3. **Edge Handle Confusion**
   - Edge handles always allow free scaling (regardless of `lockAspectRatio`)
   - Users might not understand why corner vs edge behaves differently

## Recommendations

### For `lockAspectRatio: true`:
1. ✅ **Fix sign preservation** - Don't lose sign when copying scale values
2. ✅ **Add option to lock edge handles too** - Or document that edge handles always allow free scaling
3. ✅ **Improve averaging logic** - Handle sign preservation in close-value cases
4. ✅ **Consider per-element aspect ratio** - Option to maintain each element's original aspect ratio individually

### For `lockAspectRatio: false`:
1. ✅ **Add visual feedback** - Show current aspect ratio when scaling
2. ✅ **Provide "reset aspect ratio" action** - Quick way to restore original proportions
3. ✅ **Consider snap-to-square option** - When aspect ratio is close to 1:1, snap to it

## Testing Scenarios

### Test Case 1: Sign Preservation
```javascript
// Start with element at (1, 1)
// Drag corner handle to flip horizontally
// Expected: Only X flips, Y maintains positive scale
// Current Bug: Both X and Y might flip
```

### Test Case 2: Edge Handle Behavior
```javascript
// Set lockAspectRatio: true
// Drag topCenter handle vertically
// Expected: Should user's expectation be maintained?
// Current: Edge handles ignore lockAspectRatio
```

### Test Case 3: Minimum Scale Interaction
```javascript
// Start with element at (1, 1)
// Drag corner handle to very small scale
// Watch for sudden jumps when one axis hits minimum
```

### Test Case 4: Multi-Element Group
```javascript
// Group contains square (1:1) and rectangle (2:1)
// Set lockAspectRatio: true
// Scale group by corner handle
// Verify individual element behavior
```

## Code Locations

- **Aspect Ratio Logic:** `packages/transformer/src/Transformer.ts:1754-1789`
- **Minimum Scale Enforcement:** `packages/transformer/src/Transformer.ts:1762-1765`
- **Handle Check:** `packages/transformer/src/Transformer.ts:1755-1760`
- **Test Files:** `test-local.html`, `test-multi-element.html`

