# Drag and Drop Implementation Documentation

## Overview

This document provides a comprehensive guide to the drag and drop functionality implemented for the assets page in the WealthWatch application. The implementation allows users to reorder assets within sections and move assets between different sections using an intuitive drag and drop interface.

## Technology Stack

- **@dnd-kit/core**: Core drag and drop functionality
- **@dnd-kit/sortable**: Sortable list functionality
- **@dnd-kit/utilities**: CSS transformation utilities
- **Firebase Firestore**: Backend data persistence with transactions
- **React**: Component state management and optimistic updates
- **TypeScript**: Type safety and better development experience

## Architecture

### Component Hierarchy

```
SectionList (DndContext)
├── SectionItem (Conditional Droppable - only for empty sections)
│   └── AssetTable
│       ├── InterAssetDropZone (Between assets)
│       └── SortableAssetRow (Sortable)
└── DragOverlay
```

### Key Components

#### 1. SectionList.tsx
**Purpose**: Main container that manages the drag and drop context and handles all drag operations.

**Key Features**:
- Wraps the entire section list in `DndContext`
- Manages optimistic state updates for smooth UI experience
- Handles drag start/end/over events
- Determines drop targets and calculates new positions
- Applies optimistic updates before backend calls
- Uses `closestCenter` collision detection strategy

**Key Functions**:
```typescript
const handleDragStart = (event: DragStartEvent) => {
  const activeId = event.active.id as string;
  setActiveId(activeId);
};

const handleDragOver = (event: DragOverEvent) => {
  // Updates dragOverInfo state with current drop target
  // Calculates targetIndex for precise positioning
};

const handleDragEnd = (event: DragEndEvent) => {
  // Complex logic to determine source/target sections and positions
  // Applies optimistic updates
  // Calls backend reorder function
};
```

**State Management**:
```typescript
const [activeId, setActiveId] = useState<string | null>(null);
const [optimisticAssetsBySection, setOptimisticAssetsBySection] = useState(assetsBySection);
const [dragOverInfo, setDragOverInfo] = useState<{
  overId: string | null;
  overType: string | null;
  overSectionId: string | null;
  targetIndex: number | null;
}>({
  overId: null,
  overType: null,
  overSectionId: null,
  targetIndex: null,
});
```

#### 2. SectionItem.tsx
**Purpose**: Individual section container with conditional drop zone functionality.

**Key Features**:
- **Conditional Drop Zone**: Only enabled for empty sections to prevent UI conflicts
- Provides visual feedback when assets are dragged over empty sections
- Manages section expansion/collapse state
- Contains the AssetTable component
- Prevents blue rectangle flickering by disabling drop zone for sections with assets

**Drop Target Configuration**:
```typescript
// Only create drop zone for empty sections to prevent blue rectangle flickering
const isSectionEmpty = assets.length === 0;
const { setNodeRef: setDroppableRef, isOver } = useDroppable({
  id: section.id,
  data: {
    type: 'section',
  },
  disabled: !isSectionEmpty, // Only enable for empty sections
});

// Conditional ref assignment
ref={isSectionEmpty ? setDroppableRef : undefined}

// Enhanced condition for blue background
className={`... ${
  isOver && isSectionEmpty ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200'
}`}
```

#### 3. AssetTable.tsx
**Purpose**: Displays assets within a section and provides inter-asset drop zones.

**Key Features**:
- Contains `SortableAssetRow` components for each asset
- Includes `InterAssetDropZone` components between assets for precise positioning
- Manages popup menu for asset actions
- Handles asset formatting and display
- **Zero-height drop zones** when not hovered to prevent empty space

**Sub-components**:
- `SortableAssetRow`: Individual draggable asset rows
- `InterAssetDropZone`: Drop zones between assets with zero height when inactive
- `PopupMenu`: Context menu for asset actions

**Asset Rendering Logic**:
```typescript
{assets.map((asset, index) => {
  const isActiveAsset = asset.id === activeAssetId;
  const prevAsset = index > 0 ? assets[index - 1] : null;
  const isPrevAssetActive = prevAsset?.id === activeAssetId;
  
  return (
    <React.Fragment key={asset.id}>
      {/* Drop zone before this asset - skip if current or previous asset is being dragged */}
      {!isActiveAsset && !isPrevAssetActive && (
        <InterAssetDropZone sectionId={sectionId} targetIndex={index} />
      )}
      
      <SortableAssetRow
        asset={asset}
        index={index}
        isLastAsset={index === assets.length - 1}
        // ... other props
      />
    </React.Fragment>
  );
})}

{/* Drop zone after the last asset - only if section has assets and last asset is not being dragged */}
{assets.length > 0 && assets[assets.length - 1]?.id !== activeAssetId && (
  <InterAssetDropZone sectionId={sectionId} targetIndex={assets.length} />
)}
```

#### 4. SortableAssetRow
**Purpose**: Individual asset row that can be dragged.

**Key Features**:
- Uses `useSortable` hook for drag functionality
- Provides drag handle with visual feedback
- Handles asset display and formatting
- **Hidden when dragging** to prevent layout conflicts

**Implementation**:
```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: asset.id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0 : 1,
  visibility: (isDragging ? 'hidden' : 'visible') as 'hidden' | 'visible',
};
```

#### 5. InterAssetDropZone
**Purpose**: Drop zones between assets with smart height management.

**Key Features**:
- **Zero height when inactive** to prevent unwanted empty space
- Expands to full height when hovered during drag
- Smooth transitions between states
- Prevents duplicate drop zones around dragged assets

**Implementation**:
```typescript
const InterAssetDropZone: React.FC<InterAssetDropZoneProps> = ({ sectionId, targetIndex }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `inter-${sectionId}-${targetIndex}`,
    data: {
      type: 'inter-asset',
      sectionId,
      targetIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ease-in-out ${
        isOver 
          ? 'h-12 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded-lg flex items-center justify-center' 
          : 'h-0 bg-transparent'  // Zero height when not hovered
      }`}
    >
      {isOver && (
        <div className="text-blue-600 text-sm font-medium opacity-70">
          Drop asset here
        </div>
      )}
    </div>
  );
};
```

## Drop Target Types

The current implementation supports two different drop target types:

### 1. Section Drop Zone (`type: 'section'`)
- **Target**: Section header area (only for empty sections)
- **Behavior**: Adds asset to the beginning of the section
- **Visual Feedback**: Section shows blue highlight with solid border
- **Condition**: Only active when `assets.length === 0`

### 2. Inter-Asset Drop Zone (`type: 'inter-asset'`)
- **Target**: Areas between assets within a section
- **Behavior**: Inserts asset at the exact position between assets
- **Visual Feedback**: Blue background with dashed border and "Drop asset here" text
- **Height Management**: Zero height when inactive, expands to 48px when hovered

## Drag and Drop Flow

### 1. Drag Start
```typescript
const handleDragStart = (event: DragStartEvent) => {
  const activeId = event.active.id as string;
  setActiveId(activeId); // Shows drag overlay and hides dragged asset
};
```

### 2. Drag Over
```typescript
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  
  if (!over) {
    setDragOverInfo({
      overId: null,
      overType: null,
      overSectionId: null,
      targetIndex: null,
    });
    return;
  }

  // Determine the target section and index based on the drop target type
  let overSectionId = '';
  let targetIndex = 0;
  const overType = over.data?.current?.type || '';

  if (overType === 'section') {
    overSectionId = over.id as string;
    targetIndex = 0; // Beginning of section
  } else if (overType === 'inter-asset') {
    overSectionId = over.data?.current?.sectionId || '';
    targetIndex = over.data?.current?.targetIndex || 0;
  }

  setDragOverInfo({
    overId: over.id as string,
    overType,
    overSectionId,
    targetIndex,
  });
};
```

### 3. Drag End
The `handleDragEnd` function performs several key operations:

#### a. Source Detection
```typescript
// Find which section the active asset belongs to
let sourceSectionId = '';
let sourceIndex = -1;

for (const [sectionId, assets] of Object.entries(optimisticAssetsBySection)) {
  const index = assets.findIndex(asset => asset.id === active.id);
  if (index !== -1) {
    sourceSectionId = sectionId;
    sourceIndex = index;
    break;
  }
}
```

#### b. Target Detection
```typescript
// Use dragOverInfo to determine target
const targetSectionId = dragOverInfo.overSectionId || '';
const targetIndex = dragOverInfo.targetIndex || 0;
```

#### c. Optimistic Updates
```typescript
if (sourceSectionId === targetSectionId) {
  // Within-section move
  const assets = [...newOptimisticAssets[sourceSectionId]];
  const movedAsset = assets[sourceIndex];
  assets.splice(sourceIndex, 1);
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  assets.splice(adjustedTargetIndex, 0, movedAsset);
  newOptimisticAssets[sourceSectionId] = assets;
} else {
  // Cross-section move
  const sourceAssets = [...newOptimisticAssets[sourceSectionId]];
  const targetAssets = [...(newOptimisticAssets[targetSectionId] || [])];
  const [movedAsset] = sourceAssets.splice(sourceIndex, 1);
  targetAssets.splice(targetIndex, 0, movedAsset);
  newOptimisticAssets[sourceSectionId] = sourceAssets;
  newOptimisticAssets[targetSectionId] = targetAssets;
}
```

#### d. Backend Call
```typescript
onReorderAssets(active.id as string, targetSectionId, targetIndex);
```

## Backend Implementation

### Firebase Transaction Logic

The `reorderAssets` function in `firebaseUtils.ts` handles the backend persistence:

#### Cross-Section Moves
```typescript
if (isMovingToDifferentSection) {
  // 1. Update positions in the old section (shift down assets after the moved asset)
  oldSectionSnapshot.docs.forEach((doc) => {
    const asset = doc.data();
    if (asset.position > currentAsset.position) {
      transaction.update(doc.ref, { 
        position: asset.position - 1,
        updatedAt: serverTimestamp()
      });
    }
  });

  // 2. Update positions in the target section (shift up assets at and after the new position)
  targetSectionSnapshot.docs.forEach((doc) => {
    const asset = doc.data();
    if (asset.position >= newIndex) {
      transaction.update(doc.ref, { 
        position: asset.position + 1,
        updatedAt: serverTimestamp()
      });
    }
  });

  // 3. Update the moved asset's sectionId and position
  transaction.update(movedAssetDocRef, {
    sectionId: newSectionId,
    position: newIndex,
    updatedAt: serverTimestamp()
  });
}
```

#### Within-Section Moves
```typescript
else {
  // Use arrayMove logic to determine new positions
  const reorderedAssets = [...targetAssets];
  const [movedAsset] = reorderedAssets.splice(currentIndex, 1);
  reorderedAssets.splice(newIndex, 0, movedAsset);

  // Update all assets with their new positions
  reorderedAssets.forEach((asset, index) => {
    const doc = targetSectionSnapshot.docs.find(d => d.id === asset.id);
    if (doc) {
      const oldPosition = asset.position;
      const newPosition = index;
      
      if (oldPosition !== newPosition) {
        transaction.update(doc.ref, {
          position: newPosition,
          updatedAt: serverTimestamp()
        });
      }
    }
  });
}
```

## Visual Feedback System

### Drag States
- **Dragging**: Asset becomes completely hidden (`visibility: hidden`) to prevent layout conflicts
- **Drag Overlay**: Shows a shadowed version of the asset being dragged
- **Drop Zones**: 
  - Empty sections: Blue background with solid border
  - Between assets: Blue background with dashed border and "Drop asset here" text

### CSS Classes and Styling
```typescript
// Sortable asset row styling
className={`relative grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-2 px-2 hover:bg-gray-50 group transition-all duration-200 ${
  !isLastAsset ? 'border-b border-gray-100' : ''
} ${isDragging ? 'z-50 pointer-events-none' : ''}`}

// Section hover state (only for empty sections)
className={`relative bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-visible mb-6 ${
  isOver && isSectionEmpty ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200'
}`}

// Inter-asset drop zone styling
className={`transition-all duration-200 ease-in-out ${
  isOver 
    ? 'h-12 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded-lg flex items-center justify-center' 
    : 'h-0 bg-transparent'  // Zero height when not hovered
}`}
```

## Configuration

### Sensors Configuration
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Require 8px of movement before drag starts
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### Collision Detection
```typescript
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
```

## UI Issues Fixed

### 1. Blue Rectangle Flickering
**Problem**: Blue rectangle appearing before drop zones due to conflicting drop zone implementations.
**Solution**: 
- Disabled section drop zones for sections with assets (`disabled: !isSectionEmpty`)
- Conditional ref assignment (`ref={isSectionEmpty ? setDroppableRef : undefined}`)
- Enhanced condition for blue background (`isOver && isSectionEmpty`)

### 2. Empty Space Before Assets
**Problem**: Unwanted empty space before assets caused by `InterAssetDropZone` minimum height.
**Solution**: 
- Set drop zone height to `h-0` when not hovered
- Removed `py-1` padding that was creating empty space
- Maintained smooth transitions and proper expansion during drag

### 3. Duplicate Drop Zones
**Problem**: Multiple drop zones being triggered simultaneously.
**Solution**:
- Removed redundant `TopDropZone` and `BottomDropZone` components
- Consolidated all drop functionality into `InterAssetDropZone`
- Added logic to skip drop zones around dragged assets

### 4. Drop Zone Flickering
**Problem**: Drop zones flickering when dragging between assets.
**Solution**:
- Increased minimum drop zone height from `h-1` to `h-3` for better collision detection
- Added `py-1` padding for more stable hover detection
- Later optimized to `h-0` with smooth expansion to prevent empty space

## Error Handling

### Validation
- Checks for valid section IDs before applying optimistic updates
- Validates asset existence before reordering
- Handles edge cases like dropping on the last asset
- Prevents duplicate drop zones around dragged assets

### Error Recovery
- Optimistic updates are automatically reverted when backend calls fail
- Console errors are logged for debugging (in development)
- Graceful fallbacks for invalid drop targets

## Performance Optimizations

### Optimistic Updates
- UI updates immediately for better user experience
- Backend calls happen asynchronously
- State synchronization ensures consistency

### Efficient Re-rendering
- Uses React keys for efficient component updates
- Minimizes unnecessary re-renders through proper state management
- CSS transitions provide smooth visual feedback
- Zero-height drop zones prevent layout shifts

### Memory Management
- Proper cleanup of event listeners
- Efficient state updates using functional setState
- Minimal DOM manipulations
- Conditional rendering of drop zones

## Accessibility

### Keyboard Support
- Full keyboard navigation support through `KeyboardSensor`
- Sortable keyboard coordinates for screen readers
- Proper ARIA attributes and roles

### Visual Indicators
- Clear drag handles with hover states
- Visual feedback for all interaction states
- High contrast colors for accessibility
- Smooth transitions for better user experience

## Testing Considerations

### Edge Cases Handled
- Dropping on the last asset in a section
- Moving assets between empty sections
- Rapid drag operations
- Invalid drop targets
- Dragging assets within the same section
- Preventing duplicate drop zones around dragged assets

### State Consistency
- Optimistic updates are synchronized with actual data
- Backend transactions ensure data integrity
- Error states are properly handled
- UI state is consistent across all drag operations

## Future Enhancements

### Potential Improvements
1. **Multi-select drag**: Allow dragging multiple assets at once
2. **Drag preview customization**: More detailed drag overlay
3. **Animation improvements**: Smoother transitions and micro-interactions
4. **Touch device optimization**: Better mobile drag and drop experience
5. **Undo/Redo functionality**: Allow users to undo drag operations
6. **Collision detection optimization**: Consider `closestCorners` for better precision

### Performance Optimizations
1. **Virtual scrolling**: For sections with many assets
2. **Lazy loading**: Load assets as needed
3. **Debounced updates**: Reduce backend calls during rapid operations
4. **Memoization**: Optimize component re-renders

## Troubleshooting

### Common Issues
1. **Assets not persisting**: Check Firebase transaction logic
2. **Visual glitches**: Verify optimistic update logic
3. **Performance issues**: Check for unnecessary re-renders
4. **Accessibility problems**: Ensure proper ARIA attributes
5. **Drop zone conflicts**: Verify conditional rendering logic
6. **Empty space issues**: Check drop zone height management

### Debug Tools
- Browser dev tools for inspecting drag events
- Firebase console for monitoring transactions
- React DevTools for state inspection
- Console logs for debugging (removed in production)

## Conclusion

The current drag and drop implementation provides a smooth, intuitive user experience for managing asset organization. The combination of optimistic updates, proper error handling, comprehensive visual feedback, and UI issue fixes creates a professional-grade interface that scales well with the application's needs.

Key improvements in the current implementation:
- **Eliminated UI conflicts** between different drop zone types
- **Removed unwanted empty space** through smart height management
- **Prevented flickering** with conditional drop zone rendering
- **Improved visual feedback** with consistent styling
- **Enhanced performance** through optimized re-rendering

The modular architecture makes it easy to extend and maintain, while the use of modern React patterns and Firebase transactions ensures reliability and performance.