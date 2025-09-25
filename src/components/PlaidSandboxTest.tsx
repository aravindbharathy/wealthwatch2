'use client';

import { useState } from 'react';
import { PlaidService } from '../lib/services/plaidService';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export default function PlaidSandboxTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [institutionId, setInstitutionId] = useState('ins_109508');
  const [initialProducts, setInitialProducts] = useState(['investments', 'auth']);

  const addResult = (step: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, { step, success, data, error }]);
  };

  const testSandboxFlow = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Step 1: Create sandbox public token
      addResult('Creating sandbox public token...', true);
      const { public_token } = await PlaidService.createSandboxToken(
        institutionId,
        initialProducts
      );
      addResult('✅ Public token created', true, { public_token });

      // Step 2: Exchange for access token
      addResult('Exchanging public token for access token...', true);
      const { access_token, item_id } = await PlaidService.exchangePublicToken(public_token);
      addResult('✅ Access token obtained', true, { access_token, item_id });

      // Step 3: Fetch holdings
      addResult('Fetching holdings...', true);
      const holdings = await PlaidService.getHoldings(access_token);
      addResult('✅ Holdings fetched successfully', true, {
        accounts: holdings.accounts.length,
        holdings: holdings.holdings.length,
        securities: holdings.securities.length,
        institution: PlaidService.getInstitutionName(holdings.item)
      });

    } catch (error) {
      addResult('❌ Test failed', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testCompleteFlow = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      addResult('Testing complete sandbox flow...', true);
      const holdings = await PlaidService.testSandboxFlow(institutionId, initialProducts);
      addResult('✅ Complete flow successful', true, {
        accounts: holdings.accounts.length,
        holdings: holdings.holdings.length,
        securities: holdings.securities.length,
        institution: PlaidService.getInstitutionName(holdings.item)
      });
    } catch (error) {
      addResult('❌ Complete flow failed', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Plaid Sandbox Token Test</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution ID
            </label>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ins_109508">Chase (ins_109508)</option>
              <option value="ins_109509">Wells Fargo (ins_109509)</option>
              <option value="ins_109510">Bank of America (ins_109510)</option>
              <option value="ins_109511">Capital One (ins_109511)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Products
            </label>
            <div className="space-y-2">
              {['investments', 'auth', 'transactions', 'identity'].map(product => (
                <label key={product} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={initialProducts.includes(product)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setInitialProducts([...initialProducts, product]);
                      } else {
                        setInitialProducts(initialProducts.filter(p => p !== product));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{product}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={testSandboxFlow}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Step-by-Step Flow'}
          </button>
          
          <button
            onClick={testCompleteFlow}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Complete Flow'}
          </button>
          
          <button
            onClick={clearResults}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Results
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${
                    result.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.step}
                    </span>
                    {result.success && <span className="text-green-600">✓</span>}
                    {!result.success && <span className="text-red-600">✗</span>}
                  </div>
                  
                  {result.data && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
