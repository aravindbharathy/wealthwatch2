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
├── SectionItem (Droppable)
│   └── AssetTable
│       ├── TopDropZone (Droppable)
│       ├── SortableAssetRow (Sortable + Droppable)
│       └── BottomDropZone (Droppable)
└── DragOverlay
```

### Key Components

#### 1. SectionList.tsx
**Purpose**: Main container that manages the drag and drop context and handles all drag operations.

**Key Features**:
- Wraps the entire section list in `DndContext`
- Manages optimistic state updates for smooth UI experience
- Handles drag start/end events
- Determines drop targets and calculates new positions
- Applies optimistic updates before backend calls

**Key Functions**:
```typescript
const handleDragStart = (event: DragStartEvent) => {
  const activeId = event.active.id as string;
  setActiveId(activeId);
};

const handleDragEnd = (event: DragEndEvent) => {
  // Complex logic to determine source/target sections and positions
  // Applies optimistic updates
  // Calls backend reorder function
};
```

#### 2. SectionItem.tsx
**Purpose**: Individual section container that acts as a droppable target for the entire section.

**Key Features**:
- Uses `useDroppable` to make section header droppable
- Provides visual feedback when assets are dragged over it
- Manages section expansion/collapse state
- Contains the AssetTable component

**Drop Target Configuration**:
```typescript
const { setNodeRef: setDroppableRef, isOver } = useDroppable({
  id: section.id,
  data: {
    type: 'section',
  },
});
```

#### 3. AssetTable.tsx
**Purpose**: Displays assets within a section and provides individual asset drop zones.

**Key Features**:
- Contains `SortableAssetRow` components for each asset
- Includes `TopDropZone` and `BottomDropZone` for precise positioning
- Manages popup menu for asset actions
- Handles asset formatting and display

**Sub-components**:
- `SortableAssetRow`: Individual draggable asset rows
- `TopDropZone`: Drop zone at the top of the section
- `BottomDropZone`: Drop zone at the bottom of the section
- `PopupMenu`: Context menu for asset actions

#### 4. SortableAssetRow
**Purpose**: Individual asset row that can be both dragged and used as a drop target.

**Key Features**:
- Combines `useSortable` and `useDroppable` hooks
- Provides drag handle with visual feedback
- Shows drop indicator when other assets are dragged over it
- Handles asset display and formatting

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

const { setNodeRef: setDroppableRef, isOver } = useDroppable({
  id: asset.id,
  data: {
    type: 'asset',
  },
});

// Combine both refs
const combinedRef = (node: HTMLDivElement | null) => {
  setNodeRef(node);
  setDroppableRef(node);
};
```

## Drop Target Types

The implementation supports four different drop target types:

### 1. Section Header (`type: 'section'`)
- **Target**: Section header area
- **Behavior**: Adds asset to the beginning of the section
- **Visual Feedback**: Section expands and shows blue highlight

### 2. Top Drop Zone (`type: 'top-zone'`)
- **Target**: Small area at the very top of the section
- **Behavior**: Adds asset to the beginning of the section
- **Visual Feedback**: Blue background when hovered

### 3. Asset Row (`type: 'asset'`)
- **Target**: Individual asset rows
- **Behavior**: Inserts asset at the position of the target asset
- **Special Logic**: If dropping on the last asset, inserts after it
- **Visual Feedback**: Blue background and drop indicator line

### 4. Bottom Drop Zone (`type: 'bottom-zone'`)
- **Target**: Small area at the very bottom of the section
- **Behavior**: Adds asset to the end of the section
- **Visual Feedback**: Blue background when hovered

## Drag and Drop Flow

### 1. Drag Start
```typescript
const handleDragStart = (event: DragStartEvent) => {
  const activeId = event.active.id as string;
  setActiveId(activeId); // Shows drag overlay
};
```

### 2. Drag Over
- Visual feedback is provided through CSS classes
- Drop zones become highlighted
- Drag overlay shows the asset being dragged

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
// Determine target section and index based on drop type
if (over.data?.current?.type === 'section') {
  targetSectionId = over.id as string;
  targetIndex = 0;
} else if (over.data?.current?.type === 'asset') {
  // Find target asset and calculate position
  targetIndex = index === assets.length - 1 ? index + 1 : index;
}
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
- **Dragging**: Asset becomes semi-transparent (opacity: 0.5)
- **Drag Overlay**: Shows a shadowed version of the asset being dragged
- **Drop Zones**: Highlight with blue backgrounds and borders

### CSS Classes and Styling
```typescript
// Sortable asset row styling
className={`relative grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-2 px-2 hover:bg-gray-50 group transition-all duration-200 ${
  !isLastAsset ? 'border-b border-gray-100' : ''
} ${isDragging ? 'z-50' : ''} ${
  isOver ? 'bg-blue-50' : ''
}`}

// Drop indicator line
{isOver && (
  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 shadow-lg z-20"></div>
)}

// Section hover state
className={`relative bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-visible ${
  isOver ? 'border-blue-400 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-200'
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
  onDragEnd={handleDragEnd}
>
```

## Error Handling

### Validation
- Checks for valid section IDs before applying optimistic updates
- Validates asset existence before reordering
- Handles edge cases like dropping on the last asset

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

### Memory Management
- Proper cleanup of event listeners
- Efficient state updates using functional setState
- Minimal DOM manipulations

## Accessibility

### Keyboard Support
- Full keyboard navigation support through `KeyboardSensor`
- Sortable keyboard coordinates for screen readers
- Proper ARIA attributes and roles

### Visual Indicators
- Clear drag handles with hover states
- Visual feedback for all interaction states
- High contrast colors for accessibility

## Testing Considerations

### Edge Cases Handled
- Dropping on the last asset in a section
- Moving assets between empty sections
- Rapid drag operations
- Invalid drop targets

### State Consistency
- Optimistic updates are synchronized with actual data
- Backend transactions ensure data integrity
- Error states are properly handled

## Future Enhancements

### Potential Improvements
1. **Multi-select drag**: Allow dragging multiple assets at once
2. **Drag preview customization**: More detailed drag overlay
3. **Animation improvements**: Smoother transitions and micro-interactions
4. **Touch device optimization**: Better mobile drag and drop experience
5. **Undo/Redo functionality**: Allow users to undo drag operations

### Performance Optimizations
1. **Virtual scrolling**: For sections with many assets
2. **Lazy loading**: Load assets as needed
3. **Debounced updates**: Reduce backend calls during rapid operations

## Troubleshooting

### Common Issues
1. **Assets not persisting**: Check Firebase transaction logic
2. **Visual glitches**: Verify optimistic update logic
3. **Performance issues**: Check for unnecessary re-renders
4. **Accessibility problems**: Ensure proper ARIA attributes

### Debug Tools
- Browser dev tools for inspecting drag events
- Firebase console for monitoring transactions
- React DevTools for state inspection
- Console logs for debugging (removed in production)

## Conclusion

The drag and drop implementation provides a smooth, intuitive user experience for managing asset organization. The combination of optimistic updates, proper error handling, and comprehensive visual feedback creates a professional-grade interface that scales well with the application's needs.

The modular architecture makes it easy to extend and maintain, while the use of modern React patterns and Firebase transactions ensures reliability and performance.