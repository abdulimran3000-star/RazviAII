import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Scholar } from '../types';
import { User, Book, FileText, ChevronRight } from 'lucide-react';

export default function ScholarDirectory() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);

  useEffect(() => {
    const path = 'scholars';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setScholars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scholar)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  }, []);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4">
        <h2 className="text-5xl font-light tracking-tight text-olive-drab">Scholar Knowledge Engine</h2>
        <p className="text-lg text-gray-500 max-w-2xl font-sans">
          A dynamic database of Ahl-e-Sunnat scholars, their biographies, books, and fatwas.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {scholars.map((scholar) => (
          <div 
            key={scholar.id} 
            onClick={() => setSelectedScholar(scholar)}
            className="card group cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-olive-drab/10"
          >
            <div className="flex items-start gap-6">
              <div className="w-20 h-28 bg-warm-off-white rounded-[24px] flex items-center justify-center shrink-0 overflow-hidden">
                {scholar.imageUrl ? (
                  <img 
                    src={scholar.imageUrl} 
                    alt={scholar.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={32} className="text-olive-drab/30" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-medium font-sans group-hover:text-olive-drab transition-colors">{scholar.name}</h3>
                <p className="text-sm text-gray-500 font-sans line-clamp-2 leading-relaxed italic">
                  {scholar.biography}
                </p>
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-sans">
                    <Book size={12} />
                    {scholar.books?.length || 0} Books
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-sans">
                    <FileText size={12} />
                    {scholar.fatwas?.length || 0} Fatwas
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scholar Detail Modal */}
      {selectedScholar && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl p-12 relative">
            <button 
              onClick={() => setSelectedScholar(null)}
              className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ×
            </button>
            
            <div className="flex flex-col md:flex-row gap-12">
              <div className="w-full md:w-64 shrink-0">
                <div className="w-full aspect-[3/4] bg-warm-off-white rounded-[40px] overflow-hidden">
                  {selectedScholar.imageUrl ? (
                    <img 
                      src={selectedScholar.imageUrl} 
                      alt={selectedScholar.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-olive-drab/20">
                      <User size={80} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-medium tracking-tight text-olive-drab">{selectedScholar.name}</h2>
                  <p className="text-lg text-gray-600 font-sans leading-relaxed italic">
                    {selectedScholar.biography}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">Key Books</h4>
                    <ul className="space-y-3">
                      {selectedScholar.books?.map((book, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-sans text-gray-700">
                          <div className="w-1.5 h-1.5 bg-olive-drab/30 rounded-full" />
                          {book}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-sans font-semibold">Notable Fatwas</h4>
                    <ul className="space-y-3">
                      {selectedScholar.fatwas?.map((fatwa, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-sans text-gray-700">
                          <div className="w-1.5 h-1.5 bg-olive-drab/30 rounded-full" />
                          {fatwa}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
