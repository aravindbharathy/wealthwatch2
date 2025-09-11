"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AssetSheet } from '@/lib/firebase/types';


interface SheetTabsProps {
  sheets: AssetSheet[];
  activeSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onAddSheet: () => void;
  onRenameSheet?: (sheetId: string, newName: string) => void;
  onDeleteSheet?: (sheetId: string) => void;
  isAuthenticated?: boolean;
}

export default function SheetTabs({
  sheets,
  activeSheetId,
  onSheetChange,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  isAuthenticated = true,
}: SheetTabsProps) {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 relative">
      <div className="flex items-center border-b border-gray-200">
        {/* Sheet Tabs */}
        <div className="flex-1 flex overflow-x-auto overflow-y-visible relative">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`flex items-center group relative ${
                activeSheetId === sheet.id
                  ? 'bg-blue-50 border-b-2 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => onSheetChange(sheet.id)}
                className="px-6 py-4 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                {editingSheetId === sheet.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameSave}
                    onKeyDown={handleKeyPress}
                    className="bg-transparent border-none outline-none text-sm font-medium"
                    autoFocus
                  />
                ) : (
                  sheet.name
                )}
              </button>
              
              {/* Sheet Actions Menu */}
              {isAuthenticated && (onRenameSheet || (onDeleteSheet && sheets.length > 1)) && (
                <div className="relative">
                  <button
                    ref={(el) => { buttonRefs.current[sheet.id] = el; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownToggle(sheet.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    title="Sheet options"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Sheet Button */}
        {isAuthenticated && (
          <button
            onClick={onAddSheet}
            className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l border-gray-200 focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Sheet</span>
            </div>
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
