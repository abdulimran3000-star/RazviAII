import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('gemini_api_key', apiKey);
      setStatus({ type: 'success', message: 'API Key saved successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save API Key.' });
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
                Gemini API Key
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-warm-off-white border-none rounded-2xl px-4 py-3 pr-12 font-sans text-sm focus:ring-2 focus:ring-olive-drab/20"
                  placeholder="Enter your Gemini API key..."
                />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
              <p className="text-[10px] text-gray-400 font-sans uppercase tracking-wider mt-2">
                Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-olive-drab underline">Google AI Studio</a>.
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
                className="olive-button flex-1 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Configuration
              </button>
              <button 
                type="button"
                onClick={() => {
                  localStorage.removeItem('gemini_api_key');
                  setApiKey('');
                  setStatus({ type: 'success', message: 'API Key cleared.' });
                  setTimeout(() => setStatus(null), 3000);
                }}
                className="px-6 py-3 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all font-sans text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <h4 className="text-sm font-semibold font-sans text-gray-700 mb-2">Why do I need an API Key?</h4>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              DeenAI uses Google's Gemini models to provide intelligent answers and summarize scholarly texts. 
              By providing your own API key, you ensure that the AI features remain active and responsive. 
              Your key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
