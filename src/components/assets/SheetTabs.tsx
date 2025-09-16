"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AssetSheet, Asset } from '@/lib/firebase/types';
import { useCurrency } from '@/lib/hooks/useCurrency';


interface SheetTabsProps {
  sheets: AssetSheet[];
  activeSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onAddSheet: () => void;
  onRenameSheet?: (sheetId: string, newName: string) => void;
  onDeleteSheet?: (sheetId: string) => void;
  isAuthenticated?: boolean;
  assetsBySection?: { [sectionId: string]: Asset[] };
}

export default function SheetTabs({
  sheets,
  activeSheetId,
  onSheetChange,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  isAuthenticated = true,
  assetsBySection = {},
}: SheetTabsProps) {
  const { formatCurrency } = useCurrency();
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [formattedSheetValues, setFormattedSheetValues] = useState<{ [sheetId: string]: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Calculate total value for each sheet
  const calculateSheetValue = (sheet: AssetSheet): number => {
    if (!sheet.sections) return 0;
    
    return sheet.sections.reduce((total, section) => {
      const sectionAssets = assetsBySection[section.id] || [];
      return total + sectionAssets.reduce((sectionTotal, asset) => sectionTotal + asset.currentValue, 0);
    }, 0);
  };

  // Format sheet values when sheets or assets change
  useEffect(() => {
    const formatSheetValues = async () => {
      const newFormattedValues: { [sheetId: string]: string } = {};
      
      for (const sheet of sheets) {
        const totalValue = calculateSheetValue(sheet);
        newFormattedValues[sheet.id] = await formatCurrency(totalValue);
      }
      
      setFormattedSheetValues(newFormattedValues);
    };

    formatSheetValues();
  }, [sheets, assetsBySection, formatCurrency]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Also check if the click is on any of the menu buttons
        const clickedButton = Object.values(buttonRefs.current).find(button => 
          button && button.contains(event.target as Node)
        );
        if (!clickedButton) {
          setShowDropdown(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRenameStart = (sheet: AssetSheet) => {
    setEditingSheetId(sheet.id);
    setEditingName(sheet.name);
  };

  const handleRenameSave = async () => {
    if (editingSheetId && onRenameSheet) {
      try {
        await onRenameSheet(editingSheetId, editingName);
        setEditingSheetId(null);
        setEditingName('');
      } catch (error) {
        console.error('Error renaming sheet:', error);
        // Keep editing state on error so user can try again
      }
    } else {
      setEditingSheetId(null);
      setEditingName('');
    }
  };

  const handleRenameCancel = () => {
    setEditingSheetId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSave();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDropdownToggle = (sheetId: string) => {
    if (showDropdown === sheetId) {
      setShowDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[sheetId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.right - 192, // 192px is the dropdown width (w-48)
        });
      }
      setShowDropdown(sheetId);
    }
  };

  const handleRenameClick = (sheet: AssetSheet) => {
    setShowDropdown(null);
    setDropdownPosition(null);
    handleRenameStart(sheet);
  };

  const handleDeleteClick = (sheetId: string) => {
    setShowDropdown(null);
    if (onDeleteSheet) {
      onDeleteSheet(sheetId);
    }
  };

  // Get color for sheet based on index
  const getSheetColor = (index: number, isActive: boolean) => {
    if (isActive) {
      return {
        bar: 'bg-pink-500', // Bright pink for active sheet
        text: 'text-gray-900',
        valueText: 'text-gray-900',
        bg: 'bg-pink-50'
      };
    } else {
      return {
        bar: 'bg-purple-300', // Light purple for inactive sheets
        text: 'text-gray-700',
        valueText: 'text-gray-600',
        bg: 'bg-white'
      };
    }
  };

  return (
    <div className="mb-6 relative">
      {/* Scenario-style Sheet Display */}
      <div className="flex items-center gap-3">
        {/* Sheet Cards */}
        <div className="flex gap-3">
          {sheets.map((sheet, index) => {
            const isActive = activeSheetId === sheet.id;
            const colors = getSheetColor(index, isActive);
            const sheetValue = formattedSheetValues[sheet.id] || '$0';
            
            return (
              <div key={sheet.id} className="relative">
                <div
                  className={`flex items-center group cursor-pointer transition-all duration-200 hover:scale-105 ${colors.bg} rounded-lg border-2 ${
                    isActive ? 'border-pink-200 shadow-sm' : 'border-gray-200 hover:border-purple-200'
                  } p-3 min-w-[160px]`}
                >
                  {/* Main sheet content - clickable area */}
                  <button
                    onClick={() => onSheetChange(sheet.id)}
                    className="flex items-center flex-1 text-left"
                  >
                    {/* Vertical Color Bar */}
                    <div className={`w-1 h-8 ${colors.bar} rounded-full mr-3`}></div>
                    
                    {/* Sheet Info */}
                    <div className="flex-1">
                      {editingSheetId === sheet.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleRenameSave}
                          onKeyDown={handleKeyPress}
                          className="bg-transparent border-none outline-none text-sm font-bold w-full"
                          autoFocus
                        />
                      ) : (
                        <div className={`text-sm font-bold ${colors.text} mb-1`}>
                          {sheet.name}
                        </div>
                      )}
                      <div className={`text-xs ${colors.valueText}`}>
                        {sheetValue}
                      </div>
                    </div>
                  </button>

                  {/* Sheet Actions Menu - separate from main button */}
                  {isAuthenticated && (onRenameSheet || (onDeleteSheet && sheets.length > 1)) && (
                    <div className="relative ml-2">
                      <button
                        ref={(el) => { buttonRefs.current[sheet.id] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownToggle(sheet.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sheet options"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Sheet Button */}
        {isAuthenticated && (
          <button
            onClick={onAddSheet}
            className="flex items-center justify-center w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 hover:scale-105"
            title="Add new sheet"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>

      {/* Portal-based Dropdown Menu */}
      {showDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-md shadow-xl z-[9999] border border-gray-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="py-1">
            {onRenameSheet && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameClick(sheets.find(s => s.id === showDropdown)!);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Rename
              </button>
            )}
            {onDeleteSheet && sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(showDropdown);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete Sheet
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
