import React, { useState, useEffect } from 'react';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Scholar, Book } from '../types';
import { Plus, Upload, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [newScholar, setNewScholar] = useState({ name: '', biography: '', books: '', fatwas: '', imageUrl: '' });
  const [isAddingScholar, setIsAddingScholar] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [bookData, setBookData] = useState({ title: '', authorId: '' });

  useEffect(() => {
    const path = 'scholars';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setScholars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scholar)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  }, []);

  const handleAddScholar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingScholar(true);
    const path = 'scholars';
    try {
      await addDoc(collection(db, path), {
        ...newScholar,
        books: newScholar.books.split(',').map(s => s.trim()).filter(Boolean),
        fatwas: newScholar.fatwas.split(',').map(s => s.trim()).filter(Boolean),
      });
      setNewScholar({ name: '', biography: '', books: '', fatwas: '', imageUrl: '' });
      setUploadStatus({ type: 'success', message: 'Scholar added successfully!' });
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Failed to add scholar.' });
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsAddingScholar(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookData.authorId || !bookData.title) {
      setUploadStatus({ type: 'error', message: 'Please fill all fields and select a file.' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `books/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // 2. Process PDF via Backend
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Ingestion failed');
      const { content } = await response.json();

      // 3. Save to Firestore
      const path = 'books';
      try {
        await addDoc(collection(db, path), {
          title: bookData.title,
          authorId: bookData.authorId,
          content,
          fileUrl,
          uploadedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      setUploadStatus({ type: 'success', message: 'Book ingested and indexed successfully!' });
      setBookData({ title: '', authorId: '' });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({ type: 'error', message: 'Failed to ingest book.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <header className="flex flex-col gap-4">
        <h2 className="text-5xl font-light tracking-tight text-olive-drab">Admin Panel</h2>
        <p className="text-lg text-gray-500 max-w-2xl font-sans">
          Manage the scholar knowledge engine and ingest new data sources.
        </p>
      </header>

      {uploadStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 font-sans text-sm ${
          uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {uploadStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {uploadStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {/* Add Scholar Form */}
        <section className="space-y-8 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Plus className="text-indigo-600" />
            <h3 className="text-2xl font-bold font-sans">Add New Scholar</h3>
          </div>
          
          <form onSubmit={handleAddScholar} className="card space-y-6 shadow-lg border-indigo-50">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-sans font-bold">Full Name</label>
              <input 
                type="text" 
                required
                value={newScholar.name}
                onChange={e => setNewScholar({...newScholar, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-sans text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. Imam Ahmed Raza Khan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-sans font-bold">Biography</label>
              <textarea 
                required
                value={newScholar.biography}
                onChange={e => setNewScholar({...newScholar, biography: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-sans text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-32"
                placeholder="Short biography..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-sans font-bold">Books (Comma separated)</label>
              <input 
                type="text" 
                value={newScholar.books}
                onChange={e => setNewScholar({...newScholar, books: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-sans text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Fatawa-e-Razvia, Kanzul Iman..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-400 font-sans font-bold">Fatwas (Comma separated)</label>
              <input 
                type="text" 
                value={newScholar.fatwas}
                onChange={e => setNewScholar({...newScholar, fatwas: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-sans text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Fatwa on..."
              />
            </div>
            <button 
              type="submit" 
              disabled={isAddingScholar}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-sans font-bold shadow-lg shadow-indigo-100 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {isAddingScholar ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
              Add Scholar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
