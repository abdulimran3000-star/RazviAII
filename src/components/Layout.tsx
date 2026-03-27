import React, { useState } from 'react';
import { BookOpen, Users, Settings, User, Cog, MessageSquare, History, Menu, X, PlusCircle, Bookmark, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onNewChat: () => void;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, onNewChat, showLoginPrompt, setShowLoginPrompt }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History, protected: true },
    { id: 'notes', label: 'Bookmarks', icon: Bookmark, protected: true },
    { id: 'scholars', label: 'Scholars', icon: Users },
    { id: 'admin', label: 'Admin', icon: Settings, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Cog, adminOnly: true },
  ];

  const isAdmin = user?.email === 'imranabdul700@gmail.com';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleTabClick = (id: string) => {
    const item = navItems.find(i => i.id === id);
    if (item?.protected && !user) {
      setShowLoginPrompt(true);
      setIsMenuOpen(false);
      return;
    }
    setActiveTab(id);
    setIsMenuOpen(false);
    setShowProfile(false);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setShowLoginPrompt(false);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('chat');
      setShowProfile(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    setActiveTab('chat');
    setIsMenuOpen(false);
    setShowProfile(false);
  };

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMenu}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">D</div>
            <h1 className="text-xl font-bold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">DeenAI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleNewChatClick}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <PlusCircle size={18} />
            New Chat
          </button>
          <button 
            onClick={handleProfileClick}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Slide-over Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.nav 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col p-6 border-r border-slate-100"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
                  <h1 className="text-xl font-bold tracking-tight font-sans">DeenAI</h1>
                </div>
                <button onClick={toggleMenu} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                <button
                  onClick={handleNewChatClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-sans text-sm font-bold mb-6 hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  <PlusCircle size={20} />
                  New Chat
                </button>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Navigation</p>
                  {navItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-sans text-sm font-medium ${
                          activeTab === item.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={20} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={handleProfileClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${showProfile ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 shadow-inner">
                    <User size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold font-sans truncate text-slate-800">{user?.displayName || 'Guest User'}</p>
                    <p className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">
                      {isAdmin ? 'Administrator' : 'Student'}
                    </p>
                  </div>
                </button>
                
                {showProfile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100"
                  >
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-xs font-medium font-sans text-indigo-900 break-all mb-4">{user?.email || 'Guest Explorer'}</p>
                    
                    {user ? (
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    ) : (
                      <button 
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        <LogIn size={14} />
                        Login with Google
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
                <AlertCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-sans text-slate-800">Assalamu Alaikum!</h3>
                <p className="text-slate-500 font-sans leading-relaxed">
                  To preserve your learning journey, save bookmarks, and view your history, please sign in. 
                  This helps us keep your data safe and accessible only to you.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogin}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-sans font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={20} />
                  Login with Google
                </button>
                <button 
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-sans font-medium hover:bg-slate-100 transition-all"
                >
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
