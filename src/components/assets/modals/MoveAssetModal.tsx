"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetSheet, AssetSection } from '@/lib/firebase/types';
import { useAssetSheets } from '@/lib/hooks/useAssetSheets';
import { useAuth } from '@/lib/hooks/useAuth';
import { reorderAssets } from '@/lib/firebase/firebaseUtils';

interface MoveAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  currentSheetId: string;
  onSuccess?: (message: string) => void;
}

interface DestinationOption {
  id: string;
  name: string;
  sheetName: string;
  sectionName: string;
  isCurrentSheet: boolean;
  type: 'asset' | 'debt';
}

export default function MoveAssetModal({
  isOpen,
  onClose,
  asset,
  currentSheetId,
  onSuccess,
}: MoveAssetModalProps) {
  const { user } = useAuth();
  const { sheets } = useAssetSheets(user?.uid || '');
  const [activeTab, setActiveTab] = useState<'assets' | 'debts'>('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedDestination(null);
      setActiveTab('assets');
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Generate destination options
  const getDestinationOptions = (): DestinationOption[] => {
    if (!sheets || !asset) return [];

    const options: DestinationOption[] = [];

    sheets.forEach((sheet) => {
      sheet.sections.forEach((section) => {
        // Skip the current section
        if (section.id === asset.sectionId) return;

        const option: DestinationOption = {
          id: section.id,
          name: `${sheet.name} / ${section.name}`,
          sheetName: sheet.name,
          sectionName: section.name,
          isCurrentSheet: sheet.id === currentSheetId,
          type: 'asset', // For now, only assets are supported
        };

        options.push(option);
      });
    });

    return options;
  };

  // Filter options based on search term
  const filteredOptions = getDestinationOptions().filter((option) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      option.sheetName.toLowerCase().includes(searchLower) ||
      option.sectionName.toLowerCase().includes(searchLower) ||
      option.name.toLowerCase().includes(searchLower)
    );
  });

  // Group options by sheet
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.sheetName]) {
      acc[option.sheetName] = [];
    }
    acc[option.sheetName].push(option);
    return acc;
  }, {} as Record<string, DestinationOption[]>);

  const handleMove = async () => {
    if (!selectedDestination || !asset || !user) return;

    setIsMoving(true);
    try {
      // Use the existing reorderAssets function to move the asset
      const result = await reorderAssets(user.uid, asset.id, selectedDestination, 0);
      
      if (result.success) {
        onSuccess?.(`Asset moved successfully`);
        onClose();
      } else {
        console.error('Failed to move asset:', result.error);
        onSuccess?.('Failed to move asset');
      }
    } catch (error) {
      console.error('Error moving asset:', error);
      onSuccess?.('Error moving asset');
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{asset.name}</h2>
              <p className="text-sm text-gray-500">Move to</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'assets'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ASSETS
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'debts'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              DEBTS
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Sheet / Section"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Options List */}
        <div className="px-6 pb-4 max-h-64 overflow-y-auto">
          {activeTab === 'assets' ? (
            <div className="space-y-2">
              {Object.keys(groupedOptions).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No sections found</p>
                </div>
              ) : (
                Object.entries(groupedOptions).map(([sheetName, options]) => (
                  <div key={sheetName} className="space-y-1">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedDestination(option.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedDestination === option.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.isCurrentSheet ? option.sectionName : option.name}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Debt sections coming soon</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedDestination || isMoving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isMoving ? 'Moving...' : 'Move'}
          </button>
        </div>
      </div>
    </div>
  );
}
