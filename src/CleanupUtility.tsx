import React, { useState } from 'react';
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function CleanupUtility() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanupTestRequests = async (universityId: string) => {
    setLoading(true);
    setStatus('Cleaning up...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-268175b3/utils/cleanup-test-requests/${universityId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (data.success) {
        setStatus(`✅ Success! Deleted ${data.deletedCount} test request(s)`);
      } else {
        setStatus(`❌ Error: ${data.error || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl mb-2">Cleanup Utility</h1>
        <p className="text-gray-600 mb-6">
          Remove test/placeholder requests from the database
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => cleanupTestRequests('stanford')}
            disabled={loading}
            className="w-full bg-[#2A73E8] text-white px-4 py-3 rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Cleaning up...' : 'Clean up Stanford test requests'}
          </button>
          
          <button
            onClick={() => cleanupTestRequests('mit')}
            disabled={loading}
            className="w-full bg-[#2A73E8] text-white px-4 py-3 rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Cleaning up...' : 'Clean up MIT test requests'}
          </button>
          
          <button
            onClick={() => cleanupTestRequests('berkeley')}
            disabled={loading}
            className="w-full bg-[#2A73E8] text-white px-4 py-3 rounded-lg hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Cleaning up...' : 'Clean up Berkeley test requests'}
          </button>
        </div>
        
        {status && (
          <div className={`mt-6 p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {status}
          </div>
        )}
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="text-[#2A73E8] hover:underline text-sm"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}