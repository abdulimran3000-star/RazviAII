import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LogIn, UserPlus, Mail, Lock, Loader2, Globe } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-warm-off-white">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-olive-drab rounded-[32px] mx-auto flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-olive-drab/20">D</div>
          <h1 className="text-4xl font-semibold tracking-tight font-sans text-olive-drab">DeenAI</h1>
          <p className="text-lg text-gray-500 font-sans">Authentic Islamic Knowledge Engine</p>
        </div>

        <div className="card shadow-2xl shadow-olive-drab/5 p-12 space-y-8">
          <div className="flex bg-warm-off-white p-1 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-sans text-sm font-semibold transition-all ${isLogin ? 'bg-white shadow-sm text-olive-drab' : 'text-gray-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-sans text-sm font-semibold transition-all ${!isLogin ? 'bg-white shadow-sm text-olive-drab' : 'text-gray-400'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-sans font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans font-bold ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-warm-off-white border-none rounded-2xl pl-12 pr-4 py-4 font-sans text-sm focus:ring-2 focus:ring-olive-drab/20"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans font-bold ml-4">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-warm-off-white border-none rounded-2xl pl-12 pr-4 py-4 font-sans text-sm focus:ring-2 focus:ring-olive-drab/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="olive-button w-full flex items-center justify-center gap-2 py-4 text-lg shadow-lg shadow-olive-drab/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-gray-400 font-sans font-bold">
              <span className="bg-white px-4">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-gray-100 font-sans text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Globe size={18} />
            Google Account
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-300 font-sans font-bold">
          Knowledge is Light
        </p>
      </div>
    </div>
  );
}
