"use client";

import { useState } from 'react';
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

  const handleRenameStart = (sheet: AssetSheet) => {
    setEditingSheetId(sheet.id);
    setEditingName(sheet.name);
  };

  const handleRenameSave = () => {
    if (editingSheetId && onRenameSheet) {
      onRenameSheet(editingSheetId, editingName);
    }
    setEditingSheetId(null);
    setEditingName('');
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center border-b border-gray-200">
        {/* Sheet Tabs */}
        <div className="flex-1 flex overflow-x-auto">
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
                className="px-6 py-4 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1">
                  {onRenameSheet && (
                    <button
                      onClick={() => handleRenameStart(sheet)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                      title="Rename sheet"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDeleteSheet && sheets.length > 1 && (
                    <button
                      onClick={() => onDeleteSheet(sheet.id)}
                      className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                      title="Delete sheet"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Sheet Button */}
        {isAuthenticated && (
          <button
            onClick={onAddSheet}
            className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
    </div>
  );
}
