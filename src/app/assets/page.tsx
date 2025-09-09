"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuthNew } from '@/lib/contexts/AuthContext';
import { clearDuplicatesFromConsole } from '@/lib/firebase/clearDuplicates';
import { useAssetSheets, useAssetSummary } from '@/lib/hooks/useAssetSheets';
import { useSectionAssets } from '@/lib/hooks/useSectionAssets';
import { useDemoAssetSheets, useDemoAssetSummary, useDemoSectionAssets } from '@/lib/hooks/useDemoAssets';
import { AssetSheet, AssetSection, Asset, CreateAssetInput, CreateAssetSheetInput, CreateAssetSectionInput } from '@/lib/firebase/types';
import { config } from '@/lib/config';
import { DEMO_USER_ID } from '@/lib/firebase/demoUserSetup';
import SummaryBar from '@/components/assets/SummaryBar';
import SheetTabs from '@/components/assets/SheetTabs';
import SectionList from '@/components/assets/SectionList';
import AddAssetModal from '@/components/assets/modals/AddAssetModal';
import AddSectionModal from '@/components/assets/modals/AddSectionModal';
import AddSheetModal from '@/components/assets/modals/AddSheetModal';

export default function AssetsPage() {
  const { user, isDemoUser, signInAsDemo } = useAuthNew();
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

  // Real Firebase hooks - use demo user ID if demo user is active AND user exists
  const effectiveUserId = (isDemoUser && user) ? DEMO_USER_ID : (user?.uid || '');
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
  } = useAssetSheets(effectiveUserId);

  const { summary, loading: summaryLoading } = useAssetSummary(activeSheetId);

  // Use demo mode if:
  // 1. No user and demo mode is enabled, OR  
  // 2. There's a Firebase error and we're not loading
  // NOTE: Demo user (isDemoUser = true) should use REAL Firebase data for persistence
  const useDemo = Boolean((!user && demoMode) || (sheetsError && !sheetsLoading));
  
  // Make clear duplicates function available globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearDuplicatesFromConsole = clearDuplicatesFromConsole;
    }
  }, []);

  
  
  // Always use Firebase data for persistence, even in demo mode
  const currentSheets = sheets;
  const currentSheetsLoading = sheetsLoading;
  const currentSheetsError = sheetsError;
  const currentSummary = summary;
  const currentSummaryLoading = summaryLoading;
  

  // Get active sheet
  const activeSheet = useMemo(() => {
    const sheet = currentSheets.find(sheet => sheet.id === activeSheetId) || null;
    return sheet;
  }, [currentSheets, activeSheetId]);

  // Get sections for active sheet
  const sections = useMemo(() => {
    if (!activeSheet) {
      return [];
    }
    const sections = activeSheet.sections || [];
    return sections;
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

  // Clear active sheet when user signs out
  useEffect(() => {
    if (!user && !isDemoUser) {
      setActiveSheetId('');
    }
  }, [user, isDemoUser]);

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
    // Only allow adding sheets if user is authenticated (including demo user)
    if (!user && !isDemoUser) {
      return;
    }
    setIsAddSheetModalOpen(true);
  };

  const handleCreateSheet = async (input: CreateAssetSheetInput) => {
    try {
      // Always use Firebase functions for persistence, even for demo users
      const sheetId = await createSheet({
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
      // Always use Firebase functions for persistence, even for demo users
      await updateSheet(sheetId, { name: newName });
    } catch (error) {
      console.error('Error renaming sheet:', error);
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (confirm('Are you sure you want to delete this sheet? This action cannot be undone.')) {
      try {
        // Always use Firebase functions for persistence, even for demo users
        await deleteSheet(sheetId);
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
      // Always use Firebase functions for persistence, even for demo users
      await updateSection(sectionId, { isExpanded: !isExpanded });
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleAddSection = () => {
    // Only allow adding sections if user is authenticated (including demo user)
    if (!user && !isDemoUser) {
      return;
    }
    setIsAddSectionModalOpen(true);
  };

  const handleCreateSection = async (input: CreateAssetSectionInput) => {
    try {
      // Always use Firebase functions for persistence, even for demo users
      await createSection({
        ...input,
        sheetId: activeSheetId,
        order: sections.length,
      });
    } catch (error) {
      console.error('❌ Error creating section:', error);
    }
  };

  const handleEditSection = (sectionId: string) => {
    // TODO: Implement edit section functionality
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section? All assets in this section will also be deleted.')) {
      try {
        // Always use Firebase functions for persistence, even for demo users
        await deleteSection(sectionId);
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
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const handleEditAsset = (assetId: string) => {
    setEditingAssetId(assetId);
    // TODO: Implement edit asset functionality
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        // This would be handled by the useSectionAssets hook
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
            <p className="text-gray-500 mb-6">
              {user || isDemoUser 
                ? "Create your first sheet to start tracking your investments"
                : "Sign in to create and manage your investment sheets"
              }
            </p>
            {(user || isDemoUser) && (
              <button
                onClick={handleAddSheet}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First Sheet
              </button>
            )}
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
              <p className="text-sm text-blue-600">
                {isDemoUser 
                  ? "You're signed in as a demo user with persistent data. Sign in with Google to use your real data."
                  : "You're viewing sample data. Sign in to use your real data or try the demo user."
                }
              </p>
            </div>
            <div className="flex gap-2">
              {!isDemoUser && (
                <button
                  onClick={() => {
                    signInAsDemo();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Sign in as Demo User
                </button>
              )}
              <button
                onClick={() => setDemoMode(!demoMode)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {demoMode ? 'Disable Demo' : 'Enable Demo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo User Indicator */}
      {isDemoUser && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">Demo User Active</h3>
              <p className="text-sm text-green-600">You're signed in as a demo user. All changes will be saved to the database.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Demo User
              </span>
            </div>
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
        isAuthenticated={Boolean(user || isDemoUser)}
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
        isAuthenticated={Boolean(user || isDemoUser)}
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
