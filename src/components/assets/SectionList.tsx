"use client";

import { AssetSection, Asset } from '@/lib/firebase/types';
import SectionItem from './SectionItem';

interface SectionListProps {
  sections: AssetSection[];
  assetsBySection: { [sectionId: string]: Asset[] };
  onToggleSection: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
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
  onAddSection,
  loading = false,
  isAuthenticated = true,
}: SectionListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      {/* Sections */}
      {sections.map((section) => (
        <SectionItem
          key={section.id}
          section={section}
          assets={assetsBySection[section.id] || []}
          onToggle={onToggleSection}
          onAddAsset={onAddAsset}
          onEditSection={onEditSection}
          onDeleteSection={onDeleteSection}
          onEditAsset={onEditAsset}
          onDeleteAsset={onDeleteAsset}
          loading={loading}
          isAuthenticated={isAuthenticated}
        />
      ))}

      {/* Add Section Button */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
  );
}
