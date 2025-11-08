# Should `lockAspectRatio` Always Be Enabled?

## Short Answer: **No, but it should be the default** ✅

## Industry Standards Analysis

### Design Tools That Default to Locked:
- **Figma**: Locked by default (Shift key to unlock)
- **Canva**: Locked by default for most elements
- **Adobe Illustrator**: Locked by default (Shift key to unlock)
- **Sketch**: Locked by default

### Design Tools That Default to Unlocked:
- **Photoshop**: Unlocked (Shift key to lock)
- **GIMP**: Unlocked

**Observation**: Modern design tools (especially web-based ones) tend to default to **locked** aspect ratio.

## Arguments FOR Always Locking

### ✅ Pros:
1. **Prevents Accidental Distortion**
   - Most users don't want to distort elements accidentally
   - Easier to maintain visual consistency
   - Better for non-expert users

2. **Matches User Mental Model**
   - When resizing photos/logos, users expect proportional scaling
   - "Squishing" is usually unintentional

3. **Better for Multi-Element Groups**
   - Maintains relative proportions between elements
   - Prevents group from becoming visually incoherent

4. **Industry Standard**
   - Most modern design tools lock by default
   - Users are familiar with this behavior

## Arguments AGAINST Always Locking

### ❌ Cons:
1. **Legitimate Use Cases for Distortion**
   - Stretching text boxes to fit content
   - Artistic effects (intentional distortion)
   - Creating perspective effects
   - Adjusting UI elements to match layouts
   - Stretching backgrounds to fill containers

2. **Edge Handles Still Allow Free Scaling**
   - Current implementation: only corner handles lock
   - Edge handles (`topCenter`, `middleLeft`, etc.) always allow free scaling
   - Creates **inconsistent UX** if lock is always on

3. **User Frustration**
   - Power users who want free scaling would be frustrated
   - Extra step (toggle) adds friction

4. **Current Implementation Bugs**
   - Sign preservation bug can cause unexpected flipping
   - Averaging logic can cause issues
   - These bugs make "always on" less reliable

## Recommendation: **Default to `true`, but make it toggleable**

### Best Practice:
```typescript
// Default constructor
lockAspectRatio: true  // ✅ Good default

// But allow users to disable
transformer.lockAspectRatio = false;  // ✅ Should be easy to toggle
```

### Why This Works:
1. **Protects novices** from accidental distortion
2. **Power users** can easily disable it
3. **Matches industry standards** (Figma, Canva)
4. **Edge handles** still provide free scaling option (inconsistency is acceptable)

## Implementation Strategy

### Option 1: Default to `true` (Recommended) ✅
```typescript
// In Transformer.ts constructor
this.lockAspectRatio = options.lockAspectRatio !== undefined 
  ? options.lockAspectRatio 
  : true;  // Default to true
```

**Pros:**
- Safe default for most users
- Matches industry standards
- Easy to disable when needed

**Cons:**
- Breaking change for existing code
- Some users might not know they can unlock

### Option 2: Default to `false` (Current) ⚠️
```typescript
this.lockAspectRatio = options.lockAspectRatio === true;
```

**Pros:**
- Maximum flexibility by default
- No breaking changes

**Cons:**
- Allows accidental distortion
- Doesn't match modern design tool expectations
- Less safe for non-expert users

### Option 3: Context-Aware Default 🎯
```typescript
// Lock by default for images, unlock for text/containers
const defaultLock = element.type === 'image' || element.type === 'logo';
this.lockAspectRatio = options.lockAspectRatio !== undefined 
  ? options.lockAspectRatio 
  : defaultLock;
```

**Pros:**
- Smart defaults based on content type
- Best of both worlds

**Cons:**
- More complex
- Requires element type detection

## Edge Handle Behavior Consideration

**Current Issue:**
- Corner handles respect `lockAspectRatio`
- Edge handles **always** allow free scaling
- This creates inconsistency

**Options:**
1. **Keep current behavior** (recommended)
   - Edge handles = quick way to distort one axis
   - Corner handles = proportional scaling
   - Users learn the difference

2. **Make edge handles respect lock too**
   - More consistent
   - But removes quick distortion option
   - Might frustrate users who want to stretch one axis

3. **Add modifier key behavior**
   - Shift + edge handle = lock aspect ratio
   - Without Shift = free scaling
   - Best UX but requires keyboard support

## Testing Recommendations

### Test Scenarios:
1. **Novice User**: Default locked prevents accidental distortion ✅
2. **Power User**: Can easily unlock when needed ✅
3. **Edge Handles**: Still allow free scaling (one-axis distortion) ✅
4. **Multi-Element**: Group maintains proportions when locked ✅

## Final Recommendation

### ✅ **Default `lockAspectRatio` to `true`**

**Rationale:**
1. Matches industry standards (Figma, Canva)
2. Protects users from accidental distortion
3. Easy to disable when needed
4. Edge handles still provide free scaling option

**Implementation:**
```typescript
// Change default in Transformer.ts constructor
this.lockAspectRatio = options.lockAspectRatio !== undefined 
  ? options.lockAspectRatio 
  : true;  // Changed from false
```

**Documentation:**
- Clearly document that edge handles allow free scaling
- Show examples of when to unlock aspect ratio
- Provide keyboard shortcut option (Shift key) if possible

**But Fix Bugs First:**
- Fix sign preservation bug before making it default
- Fix averaging logic
- Test thoroughly with multi-element groups

## Conclusion

**Should it always be enabled?** No - users need flexibility.

**Should it default to enabled?** Yes - protects most users, matches industry standards, and power users can easily disable it.

**Current State:** Defaults to `false` - consider changing to `true` after fixing bugs.

