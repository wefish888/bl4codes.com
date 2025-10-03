import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $codes, $filteredCodes, $loading, $error, fetchCodes, copyCode } from '../../lib/stores/codes';
import type { ShiftCode } from '../../types/api';

// React version of CodeCard component
function CodeCardComponent({ code }: { code: ShiftCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Record copy event (async, don't wait for it)
      copyCode(code.id).catch(error => {
        console.warn('Failed to record copy event:', error);
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
  const isReddit = (code.sourceUrl && code.sourceUrl.includes('reddit')) || code.source === 'reddit';

  // Mask the last 5 characters of the code
  const maskedCode = code.code.length > 5
    ? code.code.slice(0, -5) + '*****'
    : code.code;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
              {maskedCode}
            </code>
            {isReddit && (
              <span className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium">
                Reddit
              </span>
            )}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isExpired
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : code.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {isExpired ? 'Expired' : code.status === 'active' ? 'Active' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {code.reward || 'Game Reward'}
        </h3>

        {/* Platforms */}
        <div className="flex items-center gap-2 mb-3">
          {code.platforms.map((platform) => (
            <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {platform === 'pc' ? '🖥️ PC' :
               platform === 'playstation' ? '🎮 PlayStation' :
               platform === 'xbox' ? '🎯 Xbox' : platform}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Copied {code.copyCount || 0} times</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Uploaded {new Date(code.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            copied
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {copied ? '✅ Copied' : '📋 Copy Code'}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Source: Network
      </div>
    </div>
  );
}

export default function CodeList() {
  const codes = useStore($codes);
  const filteredCodes = useStore($filteredCodes);
  const loading = useStore($loading);
  const error = useStore($error);

  // Fetch data when component mounts
  useEffect(() => {
    fetchCodes();
  }, []);

  if (loading && codes.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Latest Codes
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Loading Failed
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => fetchCodes()}
                  className="text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Latest Codes
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 animate-pulse text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8"/>
          </svg>
          Real-time Updates ({filteredCodes.length} codes)
        </div>
      </div>

      {/* Code grid */}
      {filteredCodes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCodes.map((code) => (
            <CodeCardComponent key={code.id} code={code} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Codes Available</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No codes match the current filter criteria. Please adjust your filters or try again later.
          </p>
        </div>
      )}
    </div>
  );
}