import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setApiKey(settingsDoc.data().gemini_api_key || '');
        }
      } catch (error) {
        console.error("Error fetching global settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        gemini_api_key: apiKey,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setStatus({ type: 'success', message: 'Global API Key saved successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error saving global settings:", error);
      setStatus({ type: 'error', message: 'Failed to save Global API Key. Make sure you are an admin.' });
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4">
        <h2 className="text-5xl font-light tracking-tight text-olive-drab">Settings</h2>
        <p className="text-lg text-gray-500 max-w-2xl font-sans">
          Configure your API keys and application preferences.
        </p>
      </header>

      <div className="max-w-2xl">
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Key className="text-olive-drab" />
            <h3 className="text-2xl font-medium font-sans">API Configuration</h3>
          </div>

          <form onSubmit={handleSave} className="card space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-400 font-sans font-semibold">
                Global Gemini API Key
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-warm-off-white border-none rounded-2xl px-4 py-3 pr-12 font-sans text-sm focus:ring-2 focus:ring-olive-drab/20"
                  placeholder="Enter the global Gemini API key..."
                  disabled={loading}
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
              <p className="text-[10px] text-gray-400 font-sans uppercase tracking-wider mt-2">
                This key will be used for all users of the application.
              </p>
            </div>

            {status && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 font-sans text-sm ${
                status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                {status.message}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="olive-button flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Global Configuration
              </button>
            </div>
          </form>

          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <h4 className="text-sm font-semibold font-sans text-gray-700 mb-2">Admin Control</h4>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              As an administrator, you manage the API configuration for the entire platform. 
              The key you provide here will be used by all users (both guests and logged-in students) 
              to access AI features. This ensures a consistent experience without requiring 
              every user to provide their own key.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
