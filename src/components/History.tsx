import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Chat } from '../types';
import { MessageSquare, Trash2, Clock, ChevronRight, Loader2 } from 'lucide-react';

interface HistoryProps {
  user: any;
  setActiveChatId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export default function History({ user, setActiveChatId, setActiveTab }: HistoryProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const path = 'chats';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      where('hasSearched', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Chat));
      
      // Sort on client
      chatList.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || 0;
        const timeB = (b.createdAt as any)?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setChats(chatList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'chats', id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const openChat = (id: string) => {
    setActiveChatId(id);
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8 bg-white rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-100">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Clock size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-sans text-slate-800 tracking-tight">Chat History</h2>
          <p className="text-slate-500 font-sans text-lg">Review your past conversations and learning sessions.</p>
        </div>
      </div>

      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-50">
            <MessageSquare size={64} className="mx-auto text-slate-300" />
            <p className="text-xl font-sans text-slate-500 font-medium">No chat history found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => openChat(chat.id)}
                className="group flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full shadow-sm group-hover:scale-125 transition-transform" />
                  <div>
                    <h3 className="text-lg font-bold font-sans text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {chat.title || 'Untitled Conversation'}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans font-bold flex items-center gap-1.5 mt-1">
                      <Clock size={12} />
                      {chat.createdAt ? new Date((chat.createdAt as any).toMillis()).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Delete history"
                  >
                    <Trash2 size={20} />
                  </button>
                  <ChevronRight size={24} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
