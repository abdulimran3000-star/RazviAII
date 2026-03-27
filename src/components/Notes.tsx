import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Note } from '../types';
import { Bookmark, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface NotesProps {
  user: any;
}

export default function Notes({ user }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    });
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (expandedId === id) {
        setExpandedId(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8 bg-white rounded-[40px] shadow-2xl shadow-purple-100 border border-slate-100">
      <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
          <Bookmark size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-sans text-slate-800 tracking-tight">Bookmarks</h2>
          <p className="text-slate-500 font-sans text-lg">Your saved AI-generated summaries and results.</p>
        </div>
      </div>

      <div className="space-y-4">
        {notes.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-50">
            <Bookmark size={64} className="mx-auto text-slate-300" />
            <p className="text-xl font-sans text-slate-500 font-medium">No bookmarks saved yet.</p>
          </div>
        )}
        
        {notes.map((note) => (
          <div key={note.id} className="border border-slate-100 rounded-2xl overflow-hidden transition-all hover:border-purple-300 shadow-sm hover:shadow-md">
            <button 
              onClick={() => toggleExpand(note.id)}
              className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-purple-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-purple-400 shadow-sm" />
                <h3 className="text-lg font-bold font-sans text-slate-800 leading-tight">
                  {note.title.replace('Saved Result: ', '')}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-sans font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                {expandedId === note.id ? (
                  <ChevronUp size={24} className="text-purple-500" />
                ) : (
                  <ChevronDown size={24} className="text-slate-300" />
                )}
              </div>
            </button>
            
            {expandedId === note.id && (
              <div className="p-8 bg-white border-t border-slate-100 relative group animate-in slide-in-from-top-2 duration-300">
                <button 
                  onClick={(e) => handleDelete(note.id, e)}
                  className="absolute top-6 right-6 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete bookmark"
                >
                  <Trash2 size={20} />
                </button>
                <div className="prose prose-slate max-w-none font-sans text-slate-600 leading-relaxed pr-12">
                  {note.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
