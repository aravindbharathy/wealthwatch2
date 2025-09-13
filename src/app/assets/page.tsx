"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthNew } from '@/lib/contexts/AuthContext';
import { clearDuplicatesFromConsole } from '@/lib/firebase/clearDuplicates';
import { useAssetSheets } from '@/lib/hooks/useAssetSheets';
import { useDemoAssetSheets, useDemoAssetSummary, useDemoSectionAssets } from '@/lib/hooks/useDemoAssets';
import { usePortfolioValue } from '@/lib/hooks/usePortfolioValue';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { AssetSheet, AssetSection, Asset, CreateAssetInput, CreateAssetSheetInput, CreateAssetSectionInput } from '@/lib/firebase/types';
import { createAsset, deleteAsset, reorderAssets } from '@/lib/firebase/firebaseUtils';
import { initializePortfolioWithSampleData } from '@/lib/firebase/portfolioUtils';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { config } from '@/lib/config';
import { DEMO_USER_ID } from '@/lib/firebase/demoUserSetup';
import PortfolioValueSummary from '@/components/assets/PortfolioValueChart';
import SheetTabs from '@/components/assets/SheetTabs';
import SectionList from '@/components/assets/SectionList';
import SheetInsights from '@/components/assets/SheetInsights';
import AddAssetModal from '@/components/assets/modals/AddAssetModal';
import AddSectionModal from '@/components/assets/modals/AddSectionModal';
import AddSheetModal from '@/components/assets/modals/AddSheetModal';
import MoveAssetModal from '@/components/assets/modals/MoveAssetModal';

export default function AssetsPage() {
  const { user, isDemoUser, signInAsDemo } = useAuthNew();
  const { formatCurrency } = useCurrency();
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [demoMode, setDemoMode] = useState<boolean>(config.features.enableDemoMode);
  const [formattedSummaryValues, setFormattedSummaryValues] = useState<{
    assets: string;
    netWorth: string;
  } | null>(null);
  
  // Modal states
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddSheetModalOpen, setIsAddSheetModalOpen] = useState(false);
  const [isMoveAssetModalOpen, setIsMoveAssetModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [editingAssetId, setEditingAssetId] = useState<string>('');
  const [movingAsset, setMovingAsset] = useState<Asset | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

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


  // Portfolio value tracking
  const { 
    portfolioHistory, 
    loading: portfolioLoading, 
    error: portfolioError,
    refreshPortfolioValue 
  } = usePortfolioValue(effectiveUserId);

  // Format summary values when portfolio history changes
  useEffect(() => {
    const formatSummaryValues = async () => {
      if (portfolioHistory.length > 0) {
        const latestValue = portfolioHistory[portfolioHistory.length - 1];
        const assetsValue = await formatCurrency(latestValue.totalValue);
        const netWorthValue = await formatCurrency(latestValue.totalValue - 1023853); // Subtract debts
        
        setFormattedSummaryValues({
          assets: assetsValue,
          netWorth: netWorthValue,
        });
      } else {
        const zeroValue = await formatCurrency(0);
        setFormattedSummaryValues({
          assets: zeroValue,
          netWorth: zeroValue,
        });
      }
    };

    formatSummaryValues();
  }, [portfolioHistory, formatCurrency]);

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

  // Custom hook to fetch assets for all sections
  const useAssetsForSections = (sections: AssetSection[], userId: string) => {
    const [assetsBySection, setAssetsBySection] = useState<{ [sectionId: string]: Asset[] }>({});
    const [loading, setLoading] = useState(false); // Start with false to prevent initial loading flicker
    const [error, setError] = useState<string | null>(null);
    const [activeListeners, setActiveListeners] = useState<Set<string>>(new Set());

    useEffect(() => {
      if (!sections.length || !userId) {
        setLoading(false);
        return;
      }

      setError(null);

      // Get section IDs for current sections
      const currentSectionIds = new Set(sections.map(s => s.id));
      
      // Only show loading if we don't have assets for any of the current sections
      const hasAssetsForCurrentSections = sections.some(section => assetsBySection[section.id]?.length > 0);
      if (!hasAssetsForCurrentSections) {
        setLoading(true);
      }

      // Set up real-time listeners for each section
      const unsubscribeFunctions: (() => void)[] = [];
      const newActiveListeners = new Set<string>();

      sections.forEach((section) => {
        // Only set up listener if we don't already have one for this section
        if (!activeListeners.has(section.id)) {
          const assetsRef = collection(db, `users/${userId}/assets`);
          const q = query(
            assetsRef,
            where('sectionId', '==', section.id)
          );

          const unsubscribe = onSnapshot(q, 
            (snapshot) => {
              try {
                const assets = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt,
                  updatedAt: doc.data().updatedAt,
                })) as Asset[];

                // Sort assets by position, then by createdAt for assets without position
                const sortedAssets = assets.sort((a, b) => {
                  // If both assets have position values, sort by position
                  if (a.position !== undefined && b.position !== undefined) {
                    return a.position - b.position;
                  }
                  
                  // If only one has position, put the one with position first
                  if (a.position !== undefined && b.position === undefined) {
                    return -1;
                  }
                  if (a.position === undefined && b.position !== undefined) {
                    return 1;
                  }
                  
                  // If neither has position, sort by creation time
                  const aTime = a.createdAt?.toMillis() || 0;
                  const bTime = b.createdAt?.toMillis() || 0;
                  return aTime - bTime;
                });

                // Update state with all sections' assets - use functional update to prevent unnecessary re-renders
                setAssetsBySection(prev => {
                  const updated = { ...prev, [section.id]: sortedAssets };
                  // Only update if there's actually a change
                  if (JSON.stringify(prev[section.id]) !== JSON.stringify(sortedAssets)) {
                    return updated;
                  }
                  return prev;
                });
                setLoading(false);
              } catch (err) {
                console.error(`Error processing assets for section ${section.id}:`, err);
                setError(err instanceof Error ? err.message : 'Error processing assets');
                setLoading(false);
              }
            },
            (err) => {
              console.error(`Firebase error for section ${section.id}:`, err);
              setError(err.message);
              setLoading(false);
            }
          );

          unsubscribeFunctions.push(unsubscribe);
          newActiveListeners.add(section.id);
        }
      });

      // Update active listeners
      setActiveListeners(newActiveListeners);

      // Cleanup function - only unsubscribe from listeners that are no longer needed
      return () => {
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      };
    }, [sections.map(s => s.id).join(','), userId]); // Only depend on section IDs, not the full section objects

    return { assetsBySection, loading, error };
  };
  
  // Always use Firebase data for persistence, even in demo mode
  const currentSheets = sheets;
  const currentSheetsLoading = sheetsLoading;
  const currentSheetsError = sheetsError;

  

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
  }, [activeSheet?.id, activeSheet?.sections]);

  // Get assets by section using the new hook
  const { assetsBySection, loading: assetsLoading, error: assetsError } = useAssetsForSections(sections, effectiveUserId);

  // Get assets for the current sheet only
  const currentSheetAssets = useMemo(() => {
    if (!sections.length) return [];
    return sections.flatMap(section => assetsBySection[section.id] || []);
  }, [sections, assetsBySection]);

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

  // Initialize expanded sections - only when sections change significantly
  useEffect(() => {
    if (sections.length > 0) {
      const newExpandedSections = new Set<string>();
      sections.forEach(section => {
        if (section.isExpanded) {
          newExpandedSections.add(section.id);
        }
      });
      
      // Only update if the expanded sections are actually different
      const currentExpandedArray = Array.from(expandedSections).sort();
      const newExpandedArray = Array.from(newExpandedSections).sort();
      if (JSON.stringify(currentExpandedArray) !== JSON.stringify(newExpandedArray)) {
        setExpandedSections(newExpandedSections);
      }
    }
  }, [sections.map(s => `${s.id}-${s.isExpanded}`).join(',')]); // Only depend on section expansion state

  // Event handlers
  const handleSheetChange = useCallback((sheetId: string) => {
    // Only update if the sheet is actually different
    if (sheetId !== activeSheetId) {
      setActiveSheetId(sheetId);
    }
  }, [activeSheetId]);

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

  const handleToggleSection = useCallback(async (sectionId: string) => {
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
  }, [expandedSections, updateSection]);

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

  const handleCreateAsset = async (input: CreateAssetInput) => {
    try {
      // Use the createAsset function from firebaseUtils
      const result = await createAsset(effectiveUserId, input);
      
      if (result.success) {
        setIsAddAssetModalOpen(false);
        // The useAssetsForSections hook will automatically refresh and show the new asset
        // Update portfolio value tracking
        await refreshPortfolioValue();
      } else {
        console.error('Error creating asset:', result.error);
      }
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
        const result = await deleteAsset(effectiveUserId, assetId);
        if (result.success) {
          // The useAssetsForSections hook will automatically refresh and remove the asset
          // Update portfolio value tracking
          await refreshPortfolioValue();
        } else {
          console.error('Failed to delete asset:', result.error);
          alert('Failed to delete asset. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('An error occurred while deleting the asset. Please try again.');
      }
    }
  };

  const handleReorderAssets = async (assetId: string, newSectionId: string, newIndex: number) => {
    try {
      const result = await reorderAssets(effectiveUserId, assetId, newSectionId, newIndex);
      
      if (result.success) {
        // The useAssetsForSections hook will automatically refresh and show the new order
      } else {
        console.error('❌ Failed to reorder asset:', result.error);
        alert('Failed to reorder asset. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error reordering asset:', error);
      alert('An error occurred while reordering the asset. Please try again.');
    }
  };

  const handleMoveAsset = (assetId: string) => {
    // Find the asset in the current assets
    const asset = Object.values(assetsBySection)
      .flat()
      .find(a => a.id === assetId);
    
    if (asset) {
      setMovingAsset(asset);
      setIsMoveAssetModalOpen(true);
    }
  };

  const handleMoveSuccess = (message: string) => {
    setNotificationMessage(message);
    // Clear notification after 3 seconds
    setTimeout(() => setNotificationMessage(''), 3000);
  };

  const handleInitializePortfolio = async () => {
    try {
      await initializePortfolioWithSampleData(effectiveUserId);
      await refreshPortfolioValue();
      alert('Portfolio tracking initialized with sample data!');
    } catch (error) {
      console.error('Error initializing portfolio:', error);
      alert('Failed to initialize portfolio tracking. Please try again.');
    }
  };

  // Loading state - only show full page loading on initial load, not when switching sheets
  if (currentSheetsLoading && currentSheets.length === 0) {
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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-visible">
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
                <p className="text-sm text-green-600">You&apos;re signed in as a demo user. All changes will be saved to the database.</p>
              </div>
              <div className="flex items-center gap-2">
                {portfolioHistory.length === 0 && (
                  <button
                    onClick={handleInitializePortfolio}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Initialize Portfolio Tracking
                  </button>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Demo User
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Value Summary */}
        <PortfolioValueSummary 
          portfolioHistory={portfolioHistory} 
          loading={portfolioLoading} 
        />

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
          onMoveAsset={handleMoveAsset}
          onReorderAssets={handleReorderAssets}
          onAddSection={handleAddSection}
          loading={currentSheetsLoading && currentSheets.length === 0}
          isAuthenticated={Boolean(user || isDemoUser)}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <SheetInsights 
          currentSheetAssets={currentSheetAssets} 
          loading={assetsLoading}
          sheetName={activeSheet?.name}
        />

        {/* Net Worth Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Net Worth</h3>
          
          <p className="text-sm text-gray-600 mb-4">
            This is how your net worth is calculated. Make sure all of your accounts are connected for an accurate summary.
          </p>
          
          <div className="space-y-3">
            {/* Assets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">Assets</span>
                <span className="text-xs text-gray-500">16 accounts</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formattedSummaryValues?.assets || '$0'}
              </span>
            </div>
            
            {/* Debts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">Debts</span>
                <span className="text-xs text-gray-500">10 accounts</span>
              </div>
              <span className="text-sm font-medium text-gray-900">$1,023,853</span>
            </div>
            
            {/* Net Worth */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Total Net Worth</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formattedSummaryValues?.netWorth || '$0'}
              </span>
            </div>
          </div>
        </div>
      </div>

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

      <MoveAssetModal
        isOpen={isMoveAssetModalOpen}
        onClose={() => {
          setIsMoveAssetModalOpen(false);
          setMovingAsset(null);
        }}
        asset={movingAsset}
        currentSheetId={activeSheetId}
        onSuccess={handleMoveSuccess}
      />

      {/* Notification */}
      {notificationMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300">
          {notificationMessage}
        </div>
      )}
    </div>
  );
}
