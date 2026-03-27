import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, Plus, AlertCircle, Bookmark, Check, User, Heart } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, getDocs, limit, updateDoc, doc, getDoc, where } from 'firebase/firestore';
import { generateAnswerStream } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatProps {
  user: any;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

export default function Chat({ user, activeChatId, setActiveChatId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showModerationWarning, setShowModerationWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const RESTRICTED_WORDS = [
    'porn', 'sex', 'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
    'cunt', 'slut', 'whore', 'nude', 'naked', 'kill', 'murder', 'suicide',
    'bastard', 'motherfucker', 'cock', 'boobs', 'tits', 'vagina', 'penis',
    'xxx', 'nsfw', 'gore'
  ];

  const containsRestrictedContent = (text: string) => {
    const lowerText = text.toLowerCase();
    return RESTRICTED_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lowerText));
  };

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId || !user) {
      setMessages([]);
      return;
    }
    const path = `chats/${activeChatId}/messages`;
    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      where('userId', '==', user.uid)
    );
    
    let unsubscribe: any;
    let retryCount = 0;
    const maxRetries = 3;

    const startListening = () => {
      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        // Sort on the client to avoid needing a composite index
        msgs.sort((a, b) => {
          const timeA = (a.createdAt as any)?.toMillis?.() || 0;
          const timeB = (b.createdAt as any)?.toMillis?.() || 0;
          return timeA - timeB;
        });
        setMessages(msgs);
      }, (err) => {
        // Handle replication delay when a chat is just created
        if (err.message.includes('Missing or insufficient permissions') && retryCount < maxRetries) {
          retryCount++;
          console.warn(`Firestore permission denied, retrying (${retryCount}/${maxRetries})...`);
          setTimeout(startListening, 1000);
        } else {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      });
    };

    startListening();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeChatId, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleBookmark = async (message: Message) => {
    if (!user || bookmarkedIds.has(message.id)) return;
    
    // Find the user message that preceded this assistant message to use as the title
    const msgIndex = messages.findIndex(m => m.id === message.id);
    let searchKeyword = "Saved Result";
    if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
      searchKeyword = messages[msgIndex - 1].content;
    }

    const path = 'notes';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: searchKeyword.substring(0, 50) + (searchKeyword.length > 50 ? '...' : ''),
        content: message.content,
        format: 'detailed',
        createdAt: new Date().toISOString(),
      });
      
      setBookmarkedIds(prev => new Set(prev).add(message.id));
    } catch (err) {
      console.error("Bookmark error:", err);
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const createNewChat = async (initialMessage: string) => {
    setError(null);
    const path = 'chats';
    try {
      const docRef = await addDoc(collection(db, path), {
        userId: user.uid,
        title: initialMessage.substring(0, 40) + (initialMessage.length > 40 ? '...' : ''),
        createdAt: serverTimestamp(),
        hasSearched: true, // Mark as searched so it appears in history
      });
      setActiveChatId(docRef.id);
      return docRef.id;
    } catch (err) {
      setError("Failed to create a new chat. Please check your connection.");
      handleFirestoreError(err, OperationType.CREATE, path);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (containsRestrictedContent(input)) {
      setShowModerationWarning(true);
      return;
    }

    const userMessage = input;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setError(null);

    let currentChatId = activeChatId;

    // Create chat if it doesn't exist yet
    if (!currentChatId) {
      currentChatId = await createNewChat(userMessage);
      if (!currentChatId) {
        setIsLoading(false);
        return;
      }
    } else {
      // If chat exists, ensure it's marked as searched
      try {
        const chatRef = doc(db, 'chats', currentChatId);
        const chatDoc = await getDoc(chatRef);
        if (chatDoc.exists() && !chatDoc.data().hasSearched) {
          await updateDoc(chatRef, { hasSearched: true });
        }
      } catch (err) {
        console.error("Failed to update chat status", err);
      }
    }

    const messagesPath = `chats/${currentChatId}/messages`;

    try {
      // 1. Save user message
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        chatId: currentChatId,
        role: 'user',
        content: userMessage,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });

      // 2. Fetch RAG Context (Parallelized for speed)
      let context = "";
      let scholarInfo = "";
      
      try {
        const [booksSnapshot, scholarsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'books'), limit(3))),
          getDocs(query(collection(db, 'scholars'), limit(5)))
        ]);
        
        context = booksSnapshot.docs.map(doc => doc.data().content).join('\n\n');
        scholarInfo = scholarsSnapshot.docs.map(doc => `${doc.data().name}: ${doc.data().biography}`).join('\n');
      } catch (ragErr) {
        console.warn("RAG fetch failed, proceeding with general knowledge:", ragErr);
      }

      // 3. Generate AI Answer with Streaming
      let fullResponse = "";
      const stream = generateAnswerStream(userMessage, context, scholarInfo);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      // 4. Save AI message to Firestore
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        chatId: currentChatId,
        role: 'assistant',
        content: fullResponse,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      
      setStreamingContent('');
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage = err.message || "Unknown error";
      
      if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        const currentKey = (window as any).GEMINI_API_KEY || "";
        if (currentKey && !currentKey.startsWith("AIza")) {
          setError("Your Gemini API Key appears to be invalid (it should start with 'AIza'). Please check your AI Studio Secrets.");
        } else {
          setError("Your Gemini API Key is invalid. CRITICAL: If you just updated your key in Secrets, you MUST click the 'Share' button again in the top right of AI Studio to deploy the new key to this URL.");
        }
      } else if (errorMessage.includes("API key is required") || errorMessage.includes("missing API key")) {
        setError("Gemini API Key is missing. Please configure the GEMINI_API_KEY in your AI Studio Secrets.");
      } else {
        setError(`Something went wrong: ${errorMessage}. Please try again.`);
      }
      
      if (errorMessage.includes('PERMISSION_DENIED')) {
        handleFirestoreError(err, OperationType.WRITE, messagesPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-100 max-w-5xl mx-auto mt-2">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 md:p-10 space-y-8 scrollbar-hide">
        {!activeChatId && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Bot size={48} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold font-sans text-slate-800 tracking-tight">How can I help your journey?</h3>
              <p className="text-slate-500 font-sans max-w-sm mx-auto text-lg leading-relaxed">Ask about Fiqh, Hadith, or the lives of great Scholars.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md w-full">
              {['What is Fard-e-Kifaya?', 'Biography of Imam Abu Hanifa', 'Rules of Zakat', 'Importance of Sunnah'].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl text-sm font-medium transition-all border border-slate-100 hover:border-indigo-100 text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[80%] p-5 md:p-6 rounded-[28px] font-sans text-sm md:text-base leading-relaxed relative group shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <div className={`prose prose-sm md:prose-base max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 font-bold" />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === 'assistant' && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => handleBookmark(msg)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      bookmarkedIds.has(msg.id) 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                        : 'bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100'
                    }`}
                  >
                    {bookmarkedIds.has(msg.id) ? (
                      <><Check size={14} /> Saved to Bookmarks</>
                    ) : (
                      <><Bookmark size={14} /> Bookmark Result</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Content */}
        {streamingContent && (
          <div className="flex gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Bot size={18} />
            </div>
            <div className="max-w-[85%] md:max-w-[75%] p-4 rounded-2xl rounded-tl-none bg-gray-50 text-gray-800 font-sans text-sm leading-relaxed border border-gray-100">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {streamingContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-sans border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 bg-white">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Fiqh, Hadith, or Scholar views..."
            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 pr-20 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans text-base shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-4 font-sans font-bold uppercase tracking-[0.2em]">
          Always verify fatwas with a local Mufti. AI can make mistakes.
        </p>
      </form>

      {/* Content Moderation Modal */}
      {showModerationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <Heart size={32} />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold font-sans text-gray-900">A Gentle Reminder</h3>
              <p className="text-gray-600 font-sans text-sm leading-relaxed">
                Dear user, DeenAI is a dedicated platform for seeking authentic Islamic knowledge and spiritual growth. We kindly request you to refrain from using inappropriate, sensitive, or off-topic language. Let us maintain the purity and respect of this educational space. JazakAllah Khair.
              </p>
            </div>
            <button
              onClick={() => {
                setShowModerationWarning(false);
                setInput('');
              }}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-sans font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
