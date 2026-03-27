import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Chat from './components/Chat';
import ScholarDirectory from './components/ScholarDirectory';
import AdminPanel from './components/AdminPanel';
import Notes from './components/Notes';
import Settings from './components/Settings';
import History from './components/History';
import { Loader2 } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-off-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-olive-drab" size={48} />
          <p className="text-sm font-sans font-medium text-olive-drab uppercase tracking-widest">Initializing DeenAI...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user}
      onNewChat={() => setActiveChatId(null)}
      showLoginPrompt={showLoginPrompt}
      setShowLoginPrompt={setShowLoginPrompt}
    >
      {activeTab === 'chat' && (
        <Chat 
          user={user} 
          activeChatId={activeChatId} 
          setActiveChatId={setActiveChatId} 
          onShowLoginPrompt={() => setShowLoginPrompt(true)}
        />
      )}
      {activeTab === 'history' && <History user={user} setActiveChatId={setActiveChatId} setActiveTab={setActiveTab} />}
      {activeTab === 'scholars' && <ScholarDirectory />}
      {activeTab === 'admin' && <AdminPanel />}
      {activeTab === 'notes' && <Notes user={user} />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}
