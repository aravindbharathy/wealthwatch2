"use client";

import { useState } from 'react';
import { CreateAssetInput, Asset } from '@/lib/firebase/types';
import { ASSET_TYPES } from '@/lib/assetTypes';
import AssetTypeSelector from '../AssetTypeSelector';
import StockTickerForm from './forms/StockTickerForm';
import CashForm from './forms/CashForm';
import CryptoForm from './forms/CryptoForm';
import CryptoExchangeForm from './forms/CryptoExchangeForm';
import HomeForm from './forms/HomeForm';
import CarForm from './forms/CarForm';
import ManualAssetForm from './forms/ManualAssetForm';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  sectionId: string;
  loading?: boolean;
}

export default function AddAssetModal({
  isOpen,
  onClose,
  onSubmit,
  sectionId,
  loading = false,
}: AddAssetModalProps) {
  const [currentStep, setCurrentStep] = useState<'type-selection' | 'form'>('type-selection');
  const [selectedAssetType, setSelectedAssetType] = useState<Asset['type'] | null>(null);

  const handleTypeSelect = (type: Asset['type']) => {
    setSelectedAssetType(type);
    setCurrentStep('form');
  };

  const handleBackToTypeSelection = () => {
    setCurrentStep('type-selection');
    setSelectedAssetType(null);
  };

  const handleFormSubmit = async (assetData: CreateAssetInput) => {
    // Add the sectionId to the asset data
    const assetWithSection = {
      ...assetData,
      sectionId: sectionId,
    };

    await onSubmit(assetWithSection);
    
    // Reset modal state
    setCurrentStep('type-selection');
    setSelectedAssetType(null);
    onClose();
  };

  const handleClose = () => {
    setCurrentStep('type-selection');
    setSelectedAssetType(null);
    onClose();
  };

  if (!isOpen) return null;

  const renderForm = () => {
    if (!selectedAssetType) return null;

    const commonProps = {
      onSubmit: handleFormSubmit,
      onBack: handleBackToTypeSelection,
      loading: loading,
    };

    switch (selectedAssetType) {
      case 'stock_ticker':
        return <StockTickerForm {...commonProps} />;
      case 'cash':
        return <CashForm {...commonProps} />;
      case 'crypto_ticker':
        return <CryptoForm {...commonProps} />;
      case 'crypto_exchange_wallet':
        return <CryptoExchangeForm {...commonProps} />;
      case 'home':
        return <HomeForm {...commonProps} />;
      case 'car':
        return <CarForm {...commonProps} />;
      case 'generic_asset':
        return <ManualAssetForm {...commonProps} />;
      default:
        return <ManualAssetForm {...commonProps} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 h-[80vh] flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto">
          {currentStep === 'type-selection' ? (
            <AssetTypeSelector
              onSelectType={handleTypeSelect}
              onClose={handleClose}
            />
          ) : (
            renderForm()
          )}
        </div>
      </div>
    </div>
  );
}
