"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAssetSheets, useAssetSummary } from '@/lib/hooks/useAssetSheets';
import { useSectionAssets } from '@/lib/hooks/useSectionAssets';
import { useDemoAssetSheets, useDemoAssetSummary, useDemoSectionAssets } from '@/lib/hooks/useDemoAssets';
import { AssetSheet, AssetSection, Asset, CreateAssetInput, CreateAssetSheetInput, CreateAssetSectionInput } from '@/lib/firebase/types';
import { config } from '@/lib/config';
import SummaryBar from '@/components/assets/SummaryBar';
import SheetTabs from '@/components/assets/SheetTabs';
import SectionList from '@/components/assets/SectionList';
import AddAssetModal from '@/components/assets/modals/AddAssetModal';
import AddSectionModal from '@/components/assets/modals/AddSectionModal';
import AddSheetModal from '@/components/assets/modals/AddSheetModal';

export default function AssetsPage() {
  const { user } = useAuth();
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [demoMode, setDemoMode] = useState<boolean>(config.features.enableDemoMode);
  
  // Modal states
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [editingAssetId, setEditingAssetId] = useState<string>('');

  // Demo mode hooks
  const {
    sheets: demoSheets,
    loading: demoSheetsLoading,
    error: demoSheetsError,
    createSheet: demoCreateSheet,
    updateSheet: demoUpdateSheet,
    deleteSheet: demoDeleteSheet,
    createSection: demoCreateSection,
    updateSection: demoUpdateSection,
    deleteSection: demoDeleteSection,
  } = useDemoAssetSheets();

  const { summary: demoSummary, loading: demoSummaryLoading } = useDemoAssetSummary(activeSheetId);

  // Real Firebase hooks
  const {
    sheets,
    loading: sheetsLoading,
    error: sheetsError,
    createSheet,
    updateSheet,
    deleteSheet,
    createSection,
    updateSection,
    deleteSection,
  } = useAssetSheets(user?.uid || '');

  const { summary, loading: summaryLoading } = useAssetSummary(activeSheetId);

  // Use demo mode if no user or if there's an error with Firebase
  const useDemo = demoMode || !user || (sheetsError && !sheetsLoading);
  
  // Select the appropriate data source
  const currentSheets = useDemo ? demoSheets : sheets;
  const currentSheetsLoading = useDemo ? demoSheetsLoading : sheetsLoading;
  const currentSheetsError = useDemo ? demoSheetsError : sheetsError;
  const currentSummary = useDemo ? demoSummary : summary;
  const currentSummaryLoading = useDemo ? demoSummaryLoading : summaryLoading;

  // Get active sheet
  const activeSheet = useMemo(() => {
    return currentSheets.find(sheet => sheet.id === activeSheetId) || null;
  }, [currentSheets, activeSheetId]);

  // Get sections for active sheet
  const sections = useMemo(() => {
    if (!activeSheet) return [];
    return activeSheet.sections || [];
  }, [activeSheet]);

  // Get assets by section
  const assetsBySection = useMemo(() => {
    const result: { [sectionId: string]: Asset[] } = {};
    sections.forEach(section => {
      result[section.id] = section.assets || [];
    });
    return result;
  }, [sections]);

  // Set active sheet when sheets load
  useEffect(() => {
    if (currentSheets.length > 0 && !activeSheetId) {
      setActiveSheetId(currentSheets[0].id);
    }
  }, [currentSheets, activeSheetId]);

  // Initialize expanded sections
  useEffect(() => {
    if (sections.length > 0) {
      const newExpandedSections = new Set<string>();
      sections.forEach(section => {
        if (section.isExpanded) {
          newExpandedSections.add(section.id);
        }
      });
      setExpandedSections(newExpandedSections);
    }
  }, [sections]);

  // Event handlers
  const handleSheetChange = (sheetId: string) => {
    setActiveSheetId(sheetId);
  };

  const handleAddSheet = () => {
    setIsAddSheetModalOpen(true);
  };

  const handleCreateSheet = async (input: CreateAssetSheetInput) => {
    try {
      const createFn = useDemo ? demoCreateSheet : createSheet;
      const sheetId = await createFn({
        ...input,
        userId: user?.uid || 'demo-user',
      });
      setActiveSheetId(sheetId);
    } catch (error) {
      console.error('Error creating sheet:', error);
    }
  };

  const handleRenameSheet = async (sheetId: string, newName: string) => {
    try {
      const updateFn = useDemo ? demoUpdateSheet : updateSheet;
      await updateFn(sheetId, { name: newName });
    } catch (error) {
      console.error('Error renaming sheet:', error);
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (confirm('Are you sure you want to delete this sheet? This action cannot be undone.')) {
      try {
        const deleteFn = useDemo ? demoDeleteSheet : deleteSheet;
        await deleteFn(sheetId);
        if (activeSheetId === sheetId) {
          const remainingSheets = currentSheets.filter(s => s.id !== sheetId);
          if (remainingSheets.length > 0) {
            setActiveSheetId(remainingSheets[0].id);
          } else {
            setActiveSheetId('');
          }
        }
      } catch (error) {
        console.error('Error deleting sheet:', error);
      }
    }
  };

  const handleToggleSection = async (sectionId: string) => {
    const isExpanded = expandedSections.has(sectionId);
    const newExpandedSections = new Set(expandedSections);
    
    if (isExpanded) {
      newExpandedSections.delete(sectionId);
    } else {
      newExpandedSections.add(sectionId);
    }
    
    setExpandedSections(newExpandedSections);
    
    try {
      const updateFn = useDemo ? demoUpdateSection : updateSection;
      await updateFn(sectionId, { isExpanded: !isExpanded });
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleAddSection = () => {
    setIsAddSectionModalOpen(true);
  };

  const handleCreateSection = async (input: CreateAssetSectionInput) => {
    try {
      const createFn = useDemo ? demoCreateSection : createSection;
      await createFn({
        ...input,
        sheetId: activeSheetId,
        order: sections.length,
      });
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleEditSection = (sectionId: string) => {
    // TODO: Implement edit section functionality
    console.log('Edit section:', sectionId);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section? All assets in this section will also be deleted.')) {
      try {
        const deleteFn = useDemo ? demoDeleteSection : deleteSection;
        await deleteFn(sectionId);
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  const handleAddAsset = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setIsAddAssetModalOpen(true);
  };

  const handleCreateAsset = async (input: CreateAssetInput & { sectionId: string }) => {
    try {
      // This would be handled by the useSectionAssets hook
      // For now, we'll just close the modal
      console.log('Create asset:', input);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const handleEditAsset = (assetId: string) => {
    setEditingAssetId(assetId);
    // TODO: Implement edit asset functionality
    console.log('Edit asset:', assetId);
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        // This would be handled by the useSectionAssets hook
        console.log('Delete asset:', assetId);
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  // Loading state
  if (currentSheetsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (currentSheetsError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">Manage your investment portfolio and assets</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Assets</h3>
            <p className="text-gray-500 mb-4">{currentSheetsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No sheets state
  if (currentSheets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">Manage your investment portfolio and assets</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sheets Yet</h3>
            <p className="text-gray-500 mb-6">Create your first sheet to start tracking your investments</p>
            <button
              onClick={handleAddSheet}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create First Sheet
            </button>
          </div>
        </div>

        {/* Modals */}
        <AddSheetModal
          isOpen={isAddSheetModalOpen}
          onClose={() => setIsAddSheetModalOpen(false)}
          onSubmit={handleCreateSheet}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Toggle */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
              <p className="text-sm text-blue-600">You&apos;re viewing sample data. Sign in to use your real data.</p>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {demoMode ? 'Disable Demo' : 'Enable Demo'}
            </button>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <SummaryBar summary={currentSummary} loading={currentSummaryLoading} />

      {/* Sheet Tabs */}
      <SheetTabs
        sheets={currentSheets}
        activeSheetId={activeSheetId}
        onSheetChange={handleSheetChange}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* Section List */}
      <SectionList
        sections={sections}
        assetsBySection={assetsBySection}
        onToggleSection={handleToggleSection}
        onAddAsset={handleAddAsset}
        onEditSection={handleEditSection}
        onDeleteSection={handleDeleteSection}
        onEditAsset={handleEditAsset}
        onDeleteAsset={handleDeleteAsset}
        onAddSection={handleAddSection}
        loading={currentSheetsLoading}
      />

      {/* Modals */}
      <AddSheetModal
        isOpen={isAddSheetModalOpen}
        onClose={() => setIsAddSheetModalOpen(false)}
        onSubmit={handleCreateSheet}
      />

      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        onSubmit={handleCreateSection}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSubmit={handleCreateAsset}
        sectionId={selectedSectionId}
      />
    </div>
  );
}
