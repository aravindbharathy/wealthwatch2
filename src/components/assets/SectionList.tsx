"use client";

import { AssetSection, Asset } from '@/lib/firebase/types';
import SectionItem from './SectionItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import React, { useState } from 'react';

interface SectionListProps {
  sections: AssetSection[];
  assetsBySection: { [sectionId: string]: Asset[] };
  onToggleSection: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
  onAddSection: () => void;
  loading?: boolean;
  isAuthenticated?: boolean;
}

export default function SectionList({
  sections,
  assetsBySection,
  onToggleSection,
  onAddAsset,
  onEditSection,
  onDeleteSection,
  onEditAsset,
  onDeleteAsset,
  onReorderAssets,
  onAddSection,
  loading = false,
  isAuthenticated = true,
}: SectionListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
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
  const [optimisticAssetsBySection, setOptimisticAssetsBySection] = useState<{ [sectionId: string]: Asset[] }>(assetsBySection);

  // Sync optimistic assets with actual assets when they change
  React.useEffect(() => {
    setOptimisticAssetsBySection(assetsBySection);
  }, [assetsBySection]);

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

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    setActiveId(activeId);
  };

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

    // Find the source section of the dragged asset
    let sourceSectionId = '';
    for (const [sectionId, assets] of Object.entries(optimisticAssetsBySection)) {
      if (assets.find(asset => asset.id === active.id)) {
        sourceSectionId = sectionId;
        break;
      }
    }

    setDragOverInfo({
      overId: over.id as string,
      overType,
      overSectionId,
      targetIndex,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && onReorderAssets) {
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

      if (sourceSectionId && sourceIndex !== -1) {
        // Determine target section and index
        let targetSectionId = sourceSectionId;
        let targetIndex = sourceIndex;

        // Check the drop target type
        if (over.data?.current?.type === 'section') {
          // Dropping on section header - add to beginning
          targetSectionId = over.id as string;
          targetIndex = 0;
        } else if (over.data?.current?.type === 'inter-asset') {
          // Dropping on inter-asset zone - use the exact target index
          targetSectionId = over.data.current.sectionId;
          targetIndex = over.data.current.targetIndex;
        } else {
          // Fallback: try to find the asset by ID
          for (const [sectionId, assets] of Object.entries(optimisticAssetsBySection)) {
            const index = assets.findIndex(asset => asset.id === over.id);
            if (index !== -1) {
              targetSectionId = sectionId;
              // Always insert before the target asset
              targetIndex = index;
              break;
            }
          }
        }


        if (sourceSectionId !== targetSectionId || sourceIndex !== targetIndex) {
          // Apply optimistic update for both within-section and cross-section moves
          const newOptimisticAssets = { ...optimisticAssetsBySection };
          
          // Double-check that we have valid section IDs
          if (!sourceSectionId || !targetSectionId) {
            console.error('❌ Invalid section IDs:', { sourceSectionId, targetSectionId });
            return;
          }
          
          if (sourceSectionId === targetSectionId) {
            // Within-section move - apply optimistic update immediately
            const assets = [...newOptimisticAssets[sourceSectionId]];
            const movedAsset = assets[sourceIndex];
            
            // Remove the asset from its current position
            assets.splice(sourceIndex, 1);
            
            // Adjust targetIndex if we removed an item before the target position
            const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            
            // Insert at the new position
            assets.splice(adjustedTargetIndex, 0, movedAsset);
            
            newOptimisticAssets[sourceSectionId] = assets;
          } else {
            // Cross-section move - apply optimistic update
            const sourceAssets = [...newOptimisticAssets[sourceSectionId]];
            const targetAssets = [...(newOptimisticAssets[targetSectionId] || [])];
            
            // Remove from source
            const [movedAsset] = sourceAssets.splice(sourceIndex, 1);
            
            // Add to target at the specified position
            targetAssets.splice(targetIndex, 0, movedAsset);
            
            // Update both sections
            newOptimisticAssets[sourceSectionId] = sourceAssets;
            newOptimisticAssets[targetSectionId] = targetAssets;
          }
          
          setOptimisticAssetsBySection(newOptimisticAssets);

          // Call the backend function
          onReorderAssets(active.id as string, targetSectionId, targetIndex);
        }
      }
    }
    
    setActiveId(null);
    setDragOverInfo({
      overId: null,
      overType: null,
      overSectionId: null,
      targetIndex: null,
    });
  };
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
        <p className="text-gray-500 mb-6">
          {isAuthenticated 
            ? "Create your first section to organize your assets"
            : "Sign in to create and organize your asset sections"
          }
        </p>
        {isAuthenticated && (
          <button
            onClick={onAddSection}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Section
          </button>
        )}
      </div>
    );
  }

  return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
      <div className="space-y-2 overflow-visible">
        {/* Sections */}
        <div>
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              assets={optimisticAssetsBySection[section.id] || []}
              onToggle={onToggleSection}
              onAddAsset={onAddAsset}
              onEditSection={onEditSection}
              onDeleteSection={onDeleteSection}
              onEditAsset={onEditAsset}
              onDeleteAsset={onDeleteAsset}
              onReorderAssets={onReorderAssets}
              loading={loading}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>

        {/* Add Section Button */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <button
              onClick={onAddSection}
              className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>NEW SECTION</span>
            </button>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl opacity-95 p-2 pointer-events-none">
            <div className="font-medium text-gray-900">
              {(() => {
                // Find the asset being dragged
                for (const assets of Object.values(optimisticAssetsBySection)) {
                  const asset = assets.find(a => a.id === activeId);
                  if (asset) return asset.name;
                }
                return 'Asset';
              })()}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}